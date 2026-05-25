import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/admin/content",
          "/admin/messages",
          "/admin/users",
          "/ops-console",
          "/ops-console/",
          "/ops-console/content",
          "/ops-console/messages",
          "/ops-console/users"
        ]
      }
    ],
    sitemap: "https://dijitalizavcisi.com/sitemap.xml"
  };
}
