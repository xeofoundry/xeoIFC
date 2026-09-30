// Load an IFC file with the xeoifc library, find the external walls and write them to a new IFC file.
// The same flow as ../c/external_walls.c and ../python/external_walls.py: all three print the same lines.
//
//   dotnet run -- <xeoifc.dll or libxeoifc.so> <model.ifc>
//
// With XEO_IFC_LICENSE_KEY set, the written file is plain; without a key it carries the "xeoIFC evaluation version" marker.
using System.Globalization;
using System.Runtime.InteropServices;
using System.Text.Json;

if (args.Length < 2)
{
    Console.Error.WriteLine("usage: dotnet run -- <xeoifc.dll or libxeoifc.so> <model.ifc>");
    return 2;
}
Console.OutputEncoding = System.Text.Encoding.UTF8;
var library = Path.GetFullPath(args[0]);
NativeLibrary.SetDllImportResolver(typeof(Xeo).Assembly,
    (name, _, _) => name == Xeo.Library ? NativeLibrary.Load(library) : IntPtr.Zero);

var model = Path.GetFullPath(args[1]).Replace('\\', '/');
var s = Xeo.xeoifc_session_new();
// The session reads only below these folders.
Xeo.xeoifc_session_set_roots(s, JsonSerializer.Serialize(new[] { Path.GetDirectoryName(model)!.Replace('\\', '/') }));
var key = Environment.GetEnvironmentVariable("XEO_IFC_LICENSE_KEY");
if (!string.IsNullOrEmpty(key))
{
    Xeo.xeoifc_set_licence_key(s, key, IntPtr.Zero);
}

var job = Xeo.xeoifc_load_start(s, model, "{\"docId\":\"m\"}", IntPtr.Zero);
if (job == IntPtr.Zero)
{
    Console.Error.WriteLine(Xeo.Text(Xeo.xeoifc_last_error(s)));
    return 1;
}
int state;
IntPtr status;
while ((state = Xeo.xeoifc_job_poll(s, job, out status)) == 0) // 0 running, 1 done, 2 failed, 3 cancelled
{
    using var progress = JsonDocument.Parse(Xeo.Text(status)!);
    var p = progress.RootElement;
    Console.Write($"\r{p.GetProperty("phase").GetString()} {p.GetProperty("done")}/{p.GetProperty("total")}   ");
    Thread.Sleep(30);
}
var doneText = Xeo.Text(status) ?? "";
Xeo.xeoifc_job_free(job);
if (state != 1)
{
    Console.Error.WriteLine($"load failed: {doneText}");
    return 1;
}
using (var done = JsonDocument.Parse(doneText))
{
    var stats = done.RootElement.GetProperty("stats");
    var seconds = (done.RootElement.GetProperty("elapsedMs").GetDouble() / 1000).ToString("F2", CultureInfo.InvariantCulture);
    Console.WriteLine($"\r{Path.GetFileName(model)}: {stats.GetProperty("elements")} elements, "
        + $"{stats.GetProperty("triangles")} triangles, {seconds} s");
}

var request = JsonSerializer.Serialize(new
{
    op = "query.select",
    doc = "m",
    args = new Dictionary<string, object>
    {
        ["text"] = "is IfcWall and Pset_WallCommon.IsExternal = true",
        ["select"] = new[] { "name", "storey.Name" },
        ["includeRefs"] = true,
        ["limit"] = 1000,
    },
});
using var walls = JsonDocument.Parse(Xeo.Text(Xeo.xeoifc_call(s, request))!);
if (!walls.RootElement.GetProperty("ok").GetBoolean())
{
    Console.Error.WriteLine(walls.RootElement.GetProperty("error").GetProperty("message").GetString());
    return 1;
}
var result = walls.RootElement.GetProperty("result");
string Shown(JsonElement value) => value.ValueKind == JsonValueKind.Null ? "None" : value.ToString(); // printed like Python
foreach (var row in result.GetProperty("items").EnumerateArray())
{
    Console.WriteLine($"  {Shown(row.GetProperty("name"))} ({Shown(row.GetProperty("storey.Name"))})");
}
var ids = result.GetProperty("refs").EnumerateArray().Select(r => long.Parse(r.GetString()![1..])).ToArray(); // "#2093" -> 2093
if (ids.Length == 0) // An empty export selection means the whole document, not an empty subset.
{
    Console.WriteLine("0 external walls; no export written (any existing external-walls.ifc is unchanged)");
    Xeo.xeoifc_session_free(s);
    return 0;
}

var items = JsonSerializer.Serialize(new[] { new { docId = "m", selection = ids } });
if (Xeo.xeoifc_export(s, items, out var bytes, out var length, IntPtr.Zero) != 0)
{
    Console.Error.WriteLine(Xeo.Text(Xeo.xeoifc_last_error(s)));
    return 1;
}
var data = new byte[(int)length];
Marshal.Copy(bytes, data, 0, data.Length);
Xeo.xeoifc_free_bytes(bytes, length);
File.WriteAllBytes("external-walls.ifc", data);
Console.WriteLine($"{ids.Length} external walls -> external-walls.ifc ({data.Length / 1024} KB)");
Console.WriteLine($"evaluation marker: {(data.AsSpan().IndexOf("xeoIFC evaluation version"u8) >= 0 ? "True" : "False")}");
Xeo.xeoifc_session_free(s);
return 0;

/// <summary>The functions of xeoifc.h this sample uses (session, load job, export, licence).</summary>
static class Xeo
{
    public const string Library = "xeoifc";

    [DllImport(Library)] public static extern IntPtr xeoifc_session_new();
    [DllImport(Library)] public static extern void xeoifc_session_free(IntPtr session);
    [DllImport(Library)]
    public static extern int xeoifc_session_set_roots(IntPtr session, [MarshalAs(UnmanagedType.LPUTF8Str)] string rootsJson);
    [DllImport(Library)]
    public static extern IntPtr xeoifc_call(IntPtr session, [MarshalAs(UnmanagedType.LPUTF8Str)] string requestJson);
    [DllImport(Library)] public static extern IntPtr xeoifc_last_error(IntPtr session);
    [DllImport(Library)]
    public static extern int xeoifc_set_licence_key(IntPtr session, [MarshalAs(UnmanagedType.LPUTF8Str)] string key, IntPtr statusJson);
    [DllImport(Library)]
    public static extern IntPtr xeoifc_load_start(IntPtr session, [MarshalAs(UnmanagedType.LPUTF8Str)] string path,
        [MarshalAs(UnmanagedType.LPUTF8Str)] string optionsJson, IntPtr callbacks);
    [DllImport(Library)] public static extern int xeoifc_job_poll(IntPtr session, IntPtr job, out IntPtr statusJson);
    [DllImport(Library)] public static extern void xeoifc_job_free(IntPtr job);
    [DllImport(Library)]
    public static extern int xeoifc_export(IntPtr session, [MarshalAs(UnmanagedType.LPUTF8Str)] string itemsJson, out IntPtr bytes,
        out nuint length, IntPtr warningsJson);
    [DllImport(Library)] public static extern void xeoifc_free_string(IntPtr text);
    [DllImport(Library)] public static extern void xeoifc_free_bytes(IntPtr bytes, nuint length);

    /// <summary>A string of the library as a .NET string; gives the memory back.</summary>
    public static string? Text(IntPtr text)
    {
        if (text == IntPtr.Zero) return null;
        var value = Marshal.PtrToStringUTF8(text);
        xeoifc_free_string(text);
        return value;
    }
}
