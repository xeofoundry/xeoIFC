/* Load an IFC file with the xeoifc library, find the external walls and write them to a new IFC file.
 * The same flow as ../python/external_walls.py and ../csharp/Program.cs: all three print the same lines.
 *
 *   external_walls <model.ifc>
 *
 * The library sits next to the executable (CMakeLists.txt copies it there). With XEO_IFC_LICENSE_KEY set, the written
 * file is plain; without a key it carries the "xeoIFC evaluation version" marker. */
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <xeoifc.h>

#ifdef _WIN32
#include <windows.h>
static void pause_ms(int ms) { Sleep((DWORD)ms); }
static char* full_path(const wchar_t* path, char* out, size_t size) {
    wchar_t resolved[4096];
    if (!_wfullpath(resolved, path, sizeof resolved / sizeof *resolved)) return NULL;
    return WideCharToMultiByte(CP_UTF8, WC_ERR_INVALID_CHARS, resolved, -1, out, (int)size, NULL, NULL) ? out : NULL;
}
#else
#include <limits.h>
#include <time.h>
static void pause_ms(int ms) {
    struct timespec t = {0, ms * 1000000L};
    nanosleep(&t, NULL);
}
static char* full_path(const char* path, char* out, size_t size) {
    char resolved[PATH_MAX];
    if (!realpath(path, resolved) || strlen(resolved) >= size) return NULL;
    return strcpy(out, resolved);
}
#endif

/* Minimal JSON reading for this sample: the value after "key": as a number, or a string copied into out. The library
 * writes compact JSON; use a real JSON parser in production code. */
static const char* after_key(const char* json, const char* key) {
    char pattern[128];
    snprintf(pattern, sizeof pattern, "\"%s\":", key);
    const char* at = strstr(json, pattern);
    return at ? at + strlen(pattern) : NULL;
}

static double number_of(const char* json, const char* key) {
    const char* at = after_key(json, key);
    return at ? strtod(at, NULL) : 0.0;
}

static const char* string_of(const char* json, const char* key, char* out, size_t size) {
    const char* at = after_key(json, key);
    size_t n = 0;
    out[0] = '\0';
    if (at && strncmp(at, "null", 4) == 0) snprintf(out, size, "None"); /* printed like the Python sample */
    if (!at || *at != '"') return at;
    for (at++; *at && *at != '"' && n + 1 < size; at++) {
        if (*at == '\\' && at[1]) at++;
        out[n++] = *at;
    }
    out[n] = '\0';
    return at;
}

static char* read_error(XeoIfcSession* session) {
    char* error = xeoifc_last_error(session);
    fprintf(stderr, "%s\n", error ? error : "unknown error");
    xeoifc_free_string(error);
    return NULL;
}

#ifdef _WIN32
int wmain(int argc, wchar_t** argv) {
#else
int main(int argc, char** argv) {
#endif
    if (argc < 2) {
        fprintf(stderr, "usage: external_walls <model.ifc>\n");
        return 2;
    }
    char model[4096], folder[4096], roots[4200];
    if (!full_path(argv[1], model, sizeof model)) {
        fprintf(stderr, "cannot resolve input path\n");
        return 2;
    }
    for (char* c = model; *c; c++) {
        if (*c == '\\') *c = '/';
    }
    strcpy(folder, model);
    char* slash = strrchr(folder, '/');
    if (slash) slash[slash == folder || slash[-1] == ':' ? 1 : 0] = '\0';
    const char* name = slash ? model + (slash - folder) + 1 : model;
    snprintf(roots, sizeof roots, "[\"%s\"]", folder);

    XeoIfcSession* s = xeoifc_session_new();
    xeoifc_session_set_roots(s, roots); /* the session reads only below these folders */
    const char* key = getenv("XEO_IFC_LICENSE_KEY");
    if (key && *key) xeoifc_set_licence_key(s, key, NULL);

    XeoIfcJob* job = xeoifc_load_start(s, model, "{\"docId\":\"m\"}", NULL);
    if (!job) {
        read_error(s);
        return 1;
    }
    char* status = NULL;
    int state;
    while ((state = xeoifc_job_poll(s, job, &status)) == 0) { /* 0 running, 1 done, 2 failed, 3 cancelled */
        char phase[32];
        string_of(status, "phase", phase, sizeof phase);
        printf("\r%s %.0f/%.0f   ", phase, number_of(status, "done"), number_of(status, "total"));
        fflush(stdout);
        xeoifc_free_string(status);
        pause_ms(30);
    }
    xeoifc_job_free(job);
    if (state != 1) {
        fprintf(stderr, "load failed: %s\n", status ? status : "");
        return 1;
    }
    const char* stats = after_key(status, "stats");
    stats = stats ? stats : status;
    printf("\r%s: %.0f elements, %.0f triangles, %.2f s\n", name, number_of(stats, "elements"), number_of(stats, "triangles"),
           number_of(status, "elapsedMs") / 1000.0);
    xeoifc_free_string(status);

    char* walls = xeoifc_call(s, "{\"op\":\"query.select\",\"doc\":\"m\",\"args\":{"
                                 "\"text\":\"is IfcWall and Pset_WallCommon.IsExternal = true\","
                                 "\"select\":[\"name\",\"storey.Name\"],\"includeRefs\":true,\"limit\":1000}}");
    if (!strstr(walls, "\"ok\":true")) {
        fprintf(stderr, "%s\n", walls);
        return 1;
    }
    /* items: [{"name":..,"storey.Name":..},..] then refs: ["#2093",..] */
    const char* items = strstr(walls, "\"items\":[");
    const char* refs = strstr(walls, "\"refs\":[");
    for (const char* at = items; at && (!refs || at < refs);) {
        char wall[256], storey[256];
        at = strstr(at, "{\"");
        if (!at || (refs && at > refs)) break;
        string_of(at, "name", wall, sizeof wall);
        string_of(at, "storey.Name", storey, sizeof storey);
        printf("  %s (%s)\n", wall, storey);
        at = strchr(at, '}');
    }
    char selection[65536] = "[{\"docId\":\"m\",\"selection\":[";
    int count = 0;
    for (const char* at = refs ? strchr(refs, '[') : NULL; at && *at && *at != ']'; at++) {
        if (*at == '#') {
            long id = strtol(at + 1, NULL, 10);
            size_t used = strlen(selection);
            snprintf(selection + used, sizeof selection - used, "%s%ld", count++ ? "," : "", id);
        }
    }
    strncat(selection, "]}]", sizeof selection - strlen(selection) - 1);
    xeoifc_free_string(walls);

    if (count == 0) { /* An empty export selection means the whole document, not an empty subset. */
        puts("0 external walls; no export written (any existing external-walls.ifc is unchanged)");
        xeoifc_session_free(s);
        return 0;
    }

    uint8_t* out = NULL;
    size_t size = 0;
    if (xeoifc_export(s, selection, &out, &size, NULL) != 0) {
        read_error(s);
        return 1;
    }
    FILE* file = fopen("external-walls.ifc", "wb");
    if (!file || fwrite(out, 1, size, file) != size) {
        fprintf(stderr, "cannot write external-walls.ifc\n");
        return 1;
    }
    fclose(file);
    const char* marker = "xeoIFC evaluation version";
    bool marked = false;
    for (size_t i = 0; !marked && i + strlen(marker) <= size; i++) marked = memcmp(out + i, marker, strlen(marker)) == 0;
    printf("%d external walls -> external-walls.ifc (%zu KB)\n", count, size / 1024);
    printf("evaluation marker: %s\n", marked ? "True" : "False");
    xeoifc_free_bytes(out, size);
    xeoifc_session_free(s);
    return 0;
}
