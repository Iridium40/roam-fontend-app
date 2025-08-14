var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/upload-document.ts
var upload_document_exports = {};
__export(upload_document_exports, {
  default: () => upload_document_default
});
module.exports = __toCommonJS(upload_document_exports);
var upload_document_default = async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const folderPath = formData.get("folderPath");
    const providerId = formData.get("providerId");
    const businessId = formData.get("businessId");
    if (!file || !folderPath || !providerId || !businessId) {
      return new Response("Missing required fields", { status: 400 });
    }
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`;
    const { data, error } = await supabase.storage.from("roam-file-storage").upload(filePath, file);
    if (error) {
      console.error("Upload error:", error);
      return new Response(`Upload failed: ${error.message}`, { status: 500 });
    }
    const {
      data: { publicUrl }
    } = supabase.storage.from("roam-file-storage").getPublicUrl(filePath);
    return new Response(
      JSON.stringify({
        success: true,
        publicUrl,
        filePath: data.path
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Document upload error:", error);
    return new Response(`Internal server error: ${error.message}`, {
      status: 500
    });
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvdXBsb2FkLWRvY3VtZW50LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBDb250ZXh0IH0gZnJvbSBcIkBuZXRsaWZ5L2Z1bmN0aW9uc1wiO1xuXG4vLyBUaGlzIGZ1bmN0aW9uIGhhbmRsZXMgZG9jdW1lbnQgdXBsb2FkcyB3aXRoIHNlcnZpY2UtbGV2ZWwgcGVybWlzc2lvbnNcbi8vIHRvIGJ5cGFzcyBSTFMgcG9saWN5IGlzc3VlcyBkdXJpbmcgb25ib2FyZGluZ1xuZXhwb3J0IGRlZmF1bHQgYXN5bmMgKHJlcTogUmVxdWVzdCwgY29udGV4dDogQ29udGV4dCkgPT4ge1xuICAvLyBPbmx5IGFsbG93IFBPU1QgcmVxdWVzdHNcbiAgaWYgKHJlcS5tZXRob2QgIT09IFwiUE9TVFwiKSB7XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShcIk1ldGhvZCBub3QgYWxsb3dlZFwiLCB7IHN0YXR1czogNDA1IH0pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICAvLyBQYXJzZSB0aGUgbXVsdGlwYXJ0IGZvcm0gZGF0YVxuICAgIGNvbnN0IGZvcm1EYXRhID0gYXdhaXQgcmVxLmZvcm1EYXRhKCk7XG4gICAgY29uc3QgZmlsZSA9IGZvcm1EYXRhLmdldChcImZpbGVcIikgYXMgRmlsZTtcbiAgICBjb25zdCBmb2xkZXJQYXRoID0gZm9ybURhdGEuZ2V0KFwiZm9sZGVyUGF0aFwiKSBhcyBzdHJpbmc7XG4gICAgY29uc3QgcHJvdmlkZXJJZCA9IGZvcm1EYXRhLmdldChcInByb3ZpZGVySWRcIikgYXMgc3RyaW5nO1xuICAgIGNvbnN0IGJ1c2luZXNzSWQgPSBmb3JtRGF0YS5nZXQoXCJidXNpbmVzc0lkXCIpIGFzIHN0cmluZztcblxuICAgIGlmICghZmlsZSB8fCAhZm9sZGVyUGF0aCB8fCAhcHJvdmlkZXJJZCB8fCAhYnVzaW5lc3NJZCkge1xuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShcIk1pc3NpbmcgcmVxdWlyZWQgZmllbGRzXCIsIHsgc3RhdHVzOiA0MDAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIFN1cGFiYXNlIGNsaWVudCB3aXRoIHNlcnZpY2Ugcm9sZSBrZXkgZm9yIGVsZXZhdGVkIHBlcm1pc3Npb25zXG4gICAgY29uc3QgeyBjcmVhdGVDbGllbnQgfSA9IGF3YWl0IGltcG9ydChcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiKTtcbiAgICBjb25zdCBzdXBhYmFzZVVybCA9IHByb2Nlc3MuZW52LlZJVEVfUFVCTElDX1NVUEFCQVNFX1VSTCE7XG4gICAgY29uc3Qgc3VwYWJhc2VTZXJ2aWNlS2V5ID0gcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSE7XG5cbiAgICBjb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChzdXBhYmFzZVVybCwgc3VwYWJhc2VTZXJ2aWNlS2V5KTtcblxuICAgIC8vIEdlbmVyYXRlIHVuaXF1ZSBmaWxlbmFtZVxuICAgIGNvbnN0IGZpbGVFeHQgPSBmaWxlLm5hbWUuc3BsaXQoXCIuXCIpLnBvcCgpO1xuICAgIGNvbnN0IGZpbGVOYW1lID0gYCR7RGF0ZS5ub3coKX1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMil9LiR7ZmlsZUV4dH1gO1xuICAgIGNvbnN0IGZpbGVQYXRoID0gYCR7Zm9sZGVyUGF0aH0vJHtmaWxlTmFtZX1gO1xuXG4gICAgLy8gVXBsb2FkIGZpbGUgdXNpbmcgc2VydmljZSByb2xlIChieXBhc3NlcyBSTFMpXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2Uuc3RvcmFnZVxuICAgICAgLmZyb20oXCJyb2FtLWZpbGUtc3RvcmFnZVwiKVxuICAgICAgLnVwbG9hZChmaWxlUGF0aCwgZmlsZSk7XG5cbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJVcGxvYWQgZXJyb3I6XCIsIGVycm9yKTtcbiAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoYFVwbG9hZCBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gLCB7IHN0YXR1czogNTAwIH0pO1xuICAgIH1cblxuICAgIC8vIEdldCBwdWJsaWMgVVJMXG4gICAgY29uc3Qge1xuICAgICAgZGF0YTogeyBwdWJsaWNVcmwgfSxcbiAgICB9ID0gc3VwYWJhc2Uuc3RvcmFnZS5mcm9tKFwicm9hbS1maWxlLXN0b3JhZ2VcIikuZ2V0UHVibGljVXJsKGZpbGVQYXRoKTtcblxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoXG4gICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHB1YmxpY1VybCxcbiAgICAgICAgZmlsZVBhdGg6IGRhdGEucGF0aCxcbiAgICAgIH0pLFxuICAgICAge1xuICAgICAgICBzdGF0dXM6IDIwMCxcbiAgICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxuICAgICAgfSxcbiAgICApO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJEb2N1bWVudCB1cGxvYWQgZXJyb3I6XCIsIGVycm9yKTtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKGBJbnRlcm5hbCBzZXJ2ZXIgZXJyb3I6ICR7ZXJyb3IubWVzc2FnZX1gLCB7XG4gICAgICBzdGF0dXM6IDUwMCxcbiAgICB9KTtcbiAgfVxufTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUlBLElBQU8sMEJBQVEsT0FBTyxLQUFjLFlBQXFCO0FBRXZELE1BQUksSUFBSSxXQUFXLFFBQVE7QUFDekIsV0FBTyxJQUFJLFNBQVMsc0JBQXNCLEVBQUUsUUFBUSxJQUFJLENBQUM7QUFBQSxFQUMzRDtBQUVBLE1BQUk7QUFFRixVQUFNLFdBQVcsTUFBTSxJQUFJLFNBQVM7QUFDcEMsVUFBTSxPQUFPLFNBQVMsSUFBSSxNQUFNO0FBQ2hDLFVBQU0sYUFBYSxTQUFTLElBQUksWUFBWTtBQUM1QyxVQUFNLGFBQWEsU0FBUyxJQUFJLFlBQVk7QUFDNUMsVUFBTSxhQUFhLFNBQVMsSUFBSSxZQUFZO0FBRTVDLFFBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxZQUFZO0FBQ3RELGFBQU8sSUFBSSxTQUFTLDJCQUEyQixFQUFFLFFBQVEsSUFBSSxDQUFDO0FBQUEsSUFDaEU7QUFHQSxVQUFNLEVBQUUsYUFBYSxJQUFJLE1BQU0sT0FBTyx1QkFBdUI7QUFDN0QsVUFBTSxjQUFjLFFBQVEsSUFBSTtBQUNoQyxVQUFNLHFCQUFxQixRQUFRLElBQUk7QUFFdkMsVUFBTSxXQUFXLGFBQWEsYUFBYSxrQkFBa0I7QUFHN0QsVUFBTSxVQUFVLEtBQUssS0FBSyxNQUFNLEdBQUcsRUFBRSxJQUFJO0FBQ3pDLFVBQU0sV0FBVyxHQUFHLEtBQUssSUFBSSxDQUFDLElBQUksS0FBSyxPQUFPLEVBQUUsU0FBUyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUMsSUFBSSxPQUFPO0FBQ3BGLFVBQU0sV0FBVyxHQUFHLFVBQVUsSUFBSSxRQUFRO0FBRzFDLFVBQU0sRUFBRSxNQUFNLE1BQU0sSUFBSSxNQUFNLFNBQVMsUUFDcEMsS0FBSyxtQkFBbUIsRUFDeEIsT0FBTyxVQUFVLElBQUk7QUFFeEIsUUFBSSxPQUFPO0FBQ1QsY0FBUSxNQUFNLGlCQUFpQixLQUFLO0FBQ3BDLGFBQU8sSUFBSSxTQUFTLGtCQUFrQixNQUFNLE9BQU8sSUFBSSxFQUFFLFFBQVEsSUFBSSxDQUFDO0FBQUEsSUFDeEU7QUFHQSxVQUFNO0FBQUEsTUFDSixNQUFNLEVBQUUsVUFBVTtBQUFBLElBQ3BCLElBQUksU0FBUyxRQUFRLEtBQUssbUJBQW1CLEVBQUUsYUFBYSxRQUFRO0FBRXBFLFdBQU8sSUFBSTtBQUFBLE1BQ1QsS0FBSyxVQUFVO0FBQUEsUUFDYixTQUFTO0FBQUEsUUFDVDtBQUFBLFFBQ0EsVUFBVSxLQUFLO0FBQUEsTUFDakIsQ0FBQztBQUFBLE1BQ0Q7QUFBQSxRQUNFLFFBQVE7QUFBQSxRQUNSLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsTUFDaEQ7QUFBQSxJQUNGO0FBQUEsRUFDRixTQUFTLE9BQU87QUFDZCxZQUFRLE1BQU0sMEJBQTBCLEtBQUs7QUFDN0MsV0FBTyxJQUFJLFNBQVMsMEJBQTBCLE1BQU0sT0FBTyxJQUFJO0FBQUEsTUFDN0QsUUFBUTtBQUFBLElBQ1YsQ0FBQztBQUFBLEVBQ0g7QUFDRjsiLAogICJuYW1lcyI6IFtdCn0K
