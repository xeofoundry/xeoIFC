"""Load an IFC file with the xeoifc library, find the external walls and write them to a new IFC file.

Usage: python external_walls.py <xeoifc.dll or libxeoifc.so> <model.ifc>
Needs Python 3.8 or newer and no other package.
"""
import ctypes
import json
import pathlib
import sys
import time
from ctypes import POINTER, byref, c_char_p, c_int, c_size_t, c_void_p

lib = ctypes.CDLL(str(pathlib.Path(sys.argv[1]).resolve()))


def fn(name, restype, *argtypes):
    f = getattr(lib, name)
    f.restype, f.argtypes = restype, list(argtypes)
    return f


session_new = fn("xeoifc_session_new", c_void_p)
set_roots = fn("xeoifc_session_set_roots", c_int, c_void_p, c_char_p)
call_raw = fn("xeoifc_call", c_void_p, c_void_p, c_char_p)
last_error = fn("xeoifc_last_error", c_void_p, c_void_p)
load_start = fn("xeoifc_load_start", c_void_p, c_void_p, c_char_p, c_char_p, c_void_p)
job_poll = fn("xeoifc_job_poll", c_int, c_void_p, c_void_p, POINTER(c_void_p))
job_free = fn("xeoifc_job_free", None, c_void_p)
export = fn("xeoifc_export", c_int, c_void_p, c_char_p, POINTER(c_void_p), POINTER(c_size_t), POINTER(c_void_p))
free_string = fn("xeoifc_free_string", None, c_void_p)
free_bytes = fn("xeoifc_free_bytes", None, c_void_p, c_size_t)
session_free = fn("xeoifc_session_free", None, c_void_p)


def text(ptr):
    """A string of the library as str; gives the memory back."""
    if not ptr:
        return None
    s = ctypes.string_at(ptr).decode("utf-8")
    free_string(ptr)
    return s


model = pathlib.Path(sys.argv[2]).resolve()
s = session_new()
set_roots(s, json.dumps([model.parent.as_posix()]).encode())  # the session reads only below these folders

job = load_start(s, model.as_posix().encode(), b'{"docId":"m"}', None)
if not job:
    sys.exit(text(last_error(s)))
status = c_void_p()
while (state := job_poll(s, job, byref(status))) == 0:  # 0 running, 1 done, 2 failed, 3 cancelled
    p = json.loads(text(status.value))
    print(f"\r{p['phase']} {p['done']}/{p['total']}   ", end="", flush=True)
    time.sleep(0.03)
done = json.loads(text(status.value))
job_free(job)
if state != 1:
    sys.exit(f"load failed: {done}")
stats = done["stats"]
print(f"\r{model.name}: {stats['elements']} elements, {stats['triangles']} triangles, {done['elapsedMs'] / 1000:.2f} s")


def call(op, args):
    return json.loads(text(call_raw(s, json.dumps({"op": op, "doc": "m", "args": args}).encode())))


walls = call("query.select", {"text": "is IfcWall and Pset_WallCommon.IsExternal = true",
                              "select": ["name", "storey.Name"], "includeRefs": True, "limit": 1000})
if not walls["ok"]:
    sys.exit(walls["error"]["message"])
for row in walls["result"]["items"]:
    print(f"  {row['name']} ({row['storey.Name']})")

ids = [int(ref[1:]) for ref in walls["result"]["refs"]]  # "#2093" -> 2093
out, size = c_void_p(), c_size_t()
if export(s, json.dumps([{"docId": "m", "selection": ids}]).encode(), byref(out), byref(size), None) != 0:
    sys.exit(text(last_error(s)))
data = ctypes.string_at(out, size.value)
free_bytes(out, size)
pathlib.Path("external-walls.ifc").write_bytes(data)
print(f"{len(ids)} external walls -> external-walls.ifc ({len(data) // 1024} KB)")
print("evaluation marker:", b"xeoIFC evaluation version" in data)
session_free(s)
