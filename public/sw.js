if (!self.define) {
  let i,
    e = {};
  const c = (c, s) => (
    (c = new URL(c + ".js", s).href),
    e[c] ||
      new Promise((e) => {
        if ("document" in self) {
          const i = document.createElement("script");
          ((i.src = c), (i.onload = e), document.head.appendChild(i));
        } else ((i = c), importScripts(c), e());
      }).then(() => {
        let i = e[c];
        if (!i) throw new Error(`Module ${c} didn’t register its module`);
        return i;
      })
  );
  self.define = (s, a) => {
    const n =
      i ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (e[n]) return;
    let t = {};
    const f = (i) => c(i, n),
      u = { module: { uri: n }, exports: t, require: f };
    e[n] = Promise.all(s.map((i) => u[i] || f(i))).then((i) => (a(...i), t));
  };
}
define(["./workbox-f1770938"], function (i) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    i.clientsClaim(),
    i.precacheAndRoute(
      [
        {
          url: "/_next/static/chunks/104-38332179b68fca0b.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/1312-0b9ccf4bf90f7acf.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/1321-2952c8632038dfdf.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/1438.605a8d768740a9c2.js",
          revision: "605a8d768740a9c2",
        },
        {
          url: "/_next/static/chunks/1750-04b727e51f7a00dd.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/1771-24cccc0a84497f82.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/1882-94340405bf54760a.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/1894-9141c35ff380a8e9.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/1966-2133b07196adc582.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/1988-0690d78b65b90d53.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/2439-708addf2ef7bfb44.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/2796-7832c5824363e186.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/2878.7a8be4104df4efe6.js",
          revision: "7a8be4104df4efe6",
        },
        {
          url: "/_next/static/chunks/2898-42fb0feb4de566e7.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/2964-e85d2641216719bd.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/3002-dcdcc2b1c844e43c.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/3145-586526ba0d0e5234.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/3610-1252b3218eb60a04.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/3674-9e2e752175d9a6e0.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/3904-a6b5b44b54260b59.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/392-273588be80004d05.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/3925-ddaae691d8354b3d.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/4432-d7be24c4239ea5dd.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/4434.3027f57e0eca4251.js",
          revision: "3027f57e0eca4251",
        },
        {
          url: "/_next/static/chunks/4438-0d57a18dfbd8c3d8.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/4462-4a52e540e77b6eac.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/45.245207a12155448b.js",
          revision: "245207a12155448b",
        },
        {
          url: "/_next/static/chunks/4890-9917fd67785e8353.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/4996-448e368bec334ad3.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/5000-66ec6276e69428be.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/5422-4994d3d696fea014.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/5456.4e58c2fc16a7e124.js",
          revision: "4e58c2fc16a7e124",
        },
        {
          url: "/_next/static/chunks/5569-50fa6ada51a22872.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/5763-7e1ade3c87db14b3.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/5807-5a3c4ca214f64ed3.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/6008-59600d7fe9f33d9a.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/602dbae6-1d3c10194fa166e3.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/6425-3f81cb7e546cae2c.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/6434.9aa35874af39597b.js",
          revision: "9aa35874af39597b",
        },
        {
          url: "/_next/static/chunks/6530-d13876d17cef0bc9.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/6546-cbcd73e5d02ae763.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/6668-89d0d178d6b6af41.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/6997-81c66f76e98aa9c2.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/7089-e82f517575baf71c.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/7200-627c71ba69fb57f5.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/7362-6ab10b24c157b5f8.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/7375-18bbb2d6bc386028.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/7546.b8783a64f48377f0.js",
          revision: "b8783a64f48377f0",
        },
        {
          url: "/_next/static/chunks/7548-8390ca3d07b7b883.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/7645-67231f33ffe3fbe7.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/7648-c59e9593aff6ce6c.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/7694-69c7de780f7431d5.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/7767-d98a68e7d6e27576.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/795d4814-4818d47ae48f0e15.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/8012-589d527156242485.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/8169-06b866aef5c6fe1e.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/8193-f8fc6ccde8bd1010.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/8248-6cc5231a2c514c7e.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/8421.7c0f3008aef61619.js",
          revision: "7c0f3008aef61619",
        },
        {
          url: "/_next/static/chunks/851-0916569ef74cfb1c.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/8e1d74a4-f1e7cd5d8117a655.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/9009-bc0ed42f6aa530ce.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/9171-7afb507c54cefa9e.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/9590-769ff0a0375fbb6a.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/9599-7c4a9af4a84d2d40.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/988-002e1e1d8722b3a8.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-0431395ea066d54b.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/admin/layout-6baba15cd4d123e3.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/admin/page-5ceaf850fcc29c7b.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/attendance/%5BworkspaceId%5D/calendar/layout-4712d3d2d03c9f73.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/attendance/%5BworkspaceId%5D/calendar/page-3866c20414642119.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/attendance/%5BworkspaceId%5D/checkin/layout-70c3ca9087b774a6.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/attendance/%5BworkspaceId%5D/checkin/page-37813b4045e4cb39.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/attendance/%5BworkspaceId%5D/layout-376176c769f21a98.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/attendance/%5BworkspaceId%5D/members/loading-7cbefd60e087b0c8.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/attendance/%5BworkspaceId%5D/members/page-cf6318772c50df48.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/attendance/%5BworkspaceId%5D/page-2cb93a19cc0941c1.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/auth/page-174035b9d5b9bf59.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/calendar-callback/page-6850d2160de89c44.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/data-room/%5BworkspaceId%5D/layout-31e2a250c004950d.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/data-room/%5BworkspaceId%5D/page-423b2eeea508748a.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/home/page-0342df6e1fca0616.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/join/%5BworkspaceId%5D/page-4810274970ae4330.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/layout-2a38c0a499c4e2c7.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/page-ed37241c9e538cd1.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/projects/%5BworkspaceId%5D/board/%5BboardId%5D/page-73828ad9f6f620c4.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/projects/%5BworkspaceId%5D/layout-962f2367e738c305.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/projects/%5BworkspaceId%5D/page-102aa5afbeb605e3.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/secrets/%5BworkspaceId%5D/layout-ac4cb36d4e96aee9.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/secrets/%5BworkspaceId%5D/page-ab3ce071aaf1a3b3.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/test/%5BworkspaceId%5D/layout-3e2866831faf85a8.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/test/%5BworkspaceId%5D/page-3336518b257704e0.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/todo/%5BworkspaceId%5D/board/%5BboardId%5D/page-9180f79cb24643e4.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/todo/%5BworkspaceId%5D/layout-b124c763c29bb0cc.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/todo/%5BworkspaceId%5D/page-a42a4ce504fb3a54.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/tree/%5BworkspaceId%5D/layout-a5e298b1bd9ae06b.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/tree/%5BworkspaceId%5D/page-dc9d68f8b4b7bd89.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/workspace/%5BworkspaceId%5D/channel/%5BchannelId%5D/page-0547e11b5eb67e20.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/workspace/%5BworkspaceId%5D/layout-b80d016e21ae9634.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/workspace/%5BworkspaceId%5D/member/%5BmemberId%5D/page-907d6d2cbb153f69.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/workspace/%5BworkspaceId%5D/page-ba3e2fb7cd8ca4dc.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/app/workspace/%5BworkspaceId%5D/profile/page-2cfd789590d9f058.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/c37d3baf-69c244d2e53f7a47.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/f97e080b.d4a4660bb084228d.js",
          revision: "d4a4660bb084228d",
        },
        {
          url: "/_next/static/chunks/fc2f6fa8-56ac70e9744682bb.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/fcfb803e-eab8b07ff599a79f.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/fd9d1056-91041c96a67e11bf.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/framework-8e0e0f4a6b83a956.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/main-app-e55493aa06e0f7c9.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/main-beb5c224b236319a.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/pages/_app-3c9ca398d360b709.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/pages/_error-cf5ca766ac8f493f.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-ff1383bf9ee45209.js",
          revision: "ki5tTcVfwn39auGcCfiyi",
        },
        {
          url: "/_next/static/css/34b8d63deedec82c.css",
          revision: "34b8d63deedec82c",
        },
        {
          url: "/_next/static/css/b768cd3c08ab615c.css",
          revision: "b768cd3c08ab615c",
        },
        {
          url: "/_next/static/css/da6e9b4a73108890.css",
          revision: "da6e9b4a73108890",
        },
        {
          url: "/_next/static/css/f59bfee53fbffbfb.css",
          revision: "f59bfee53fbffbfb",
        },
        {
          url: "/_next/static/ki5tTcVfwn39auGcCfiyi/_buildManifest.js",
          revision: "6310079bf1ae7bebeb6a2135896e4564",
        },
        {
          url: "/_next/static/ki5tTcVfwn39auGcCfiyi/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/media/19cfc7226ec3afaa-s.woff2",
          revision: "9dda5cfc9a46f256d0e131bb535e46f8",
        },
        {
          url: "/_next/static/media/21350d82a1f187e9-s.woff2",
          revision: "4e2553027f1d60eff32898367dd4d541",
        },
        {
          url: "/_next/static/media/8e9860b6e62d6359-s.woff2",
          revision: "01ba6c2a184b8cba08b0d57167664d75",
        },
        {
          url: "/_next/static/media/ba9851c3c22cd980-s.woff2",
          revision: "9e494903d6b0ffec1a1e14d34427d44d",
        },
        {
          url: "/_next/static/media/c5fe6dc8356a8c31-s.woff2",
          revision: "027a89e9ab733a145db70f09b8a18b42",
        },
        {
          url: "/_next/static/media/df0a9ae256c0569c-s.woff2",
          revision: "d54db44de5ccb18886ece2fda72bdfe0",
        },
        {
          url: "/_next/static/media/e4af272ccee01ff0-s.p.woff2",
          revision: "65850a373e258f1c897a2b3d75eb74de",
        },
        { url: "/chat.png", revision: "c0b08c9ad509435d29b548d2c9f0cf9f" },
        { url: "/dataroom.png", revision: "c05ebaaf76d93832a4296c4994333533" },
        {
          url: "/icon-192x192.png",
          revision: "4d075245a9319ac6f37de8cf5d620d21",
        },
        {
          url: "/icon-512x512.png",
          revision: "4d075245a9319ac6f37de8cf5d620d21",
        },
        { url: "/image.png", revision: "bc5fc833a0a7b93ec6f6254311df4517" },
        { url: "/logo.svg", revision: "cab499031aa59c0bb65984a29aa0e711" },
        { url: "/manifest.json", revision: "605bf70b308719915ab5c6784bde78d9" },
        { url: "/miniHRMS.png", revision: "831bd930f13102a032c99d33ffd74728" },
        {
          url: "/swe-worker-5c72df51bb1f6ee0.js",
          revision: "5a47d90db13bb1309b25bdf7b363570e",
        },
        {
          url: "/taskmanagemet.png",
          revision: "122020f92a033c7ec25ea46885a700da",
        },
        { url: "/taskstree.png", revision: "e33690caf1db14c09d0f33db80f6ca9f" },
        { url: "/todo.png", revision: "2df603f92f172dd76264171adc142b63" },
        { url: "/tree.png", revision: "028d0e8c41d8054d1ca3fd24d013c7b6" },
        { url: "/user1.png", revision: "92060458ca6143b357dd70446ec4f694" },
        { url: "/user2.png", revision: "9e36cf0f887d4026f06e60b66e6c6506" },
        { url: "/user3.png", revision: "0dc719d654fdce53ec2026d80f7ee439" },
      ],
      { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] },
    ),
    i.cleanupOutdatedCaches(),
    i.registerRoute(
      "/",
      new i.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({ response: i }) =>
              i && "opaqueredirect" === i.type
                ? new Response(i.body, {
                    status: 200,
                    statusText: "OK",
                    headers: i.headers,
                  })
                : i,
          },
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new i.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new i.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new i.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new i.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      /\/_next\/static.+\.js$/i,
      new i.CacheFirst({
        cacheName: "next-static-js-assets",
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new i.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new i.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new i.RangeRequestsPlugin(),
          new i.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      /\.(?:mp4|webm)$/i,
      new i.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new i.RangeRequestsPlugin(),
          new i.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      /\.(?:js)$/i,
      new i.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      /\.(?:css|less)$/i,
      new i.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new i.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new i.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      ({ sameOrigin: i, url: { pathname: e } }) =>
        !(!i || e.startsWith("/api/auth/callback") || !e.startsWith("/api/")),
      new i.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      ({ request: i, url: { pathname: e }, sameOrigin: c }) =>
        "1" === i.headers.get("RSC") &&
        "1" === i.headers.get("Next-Router-Prefetch") &&
        c &&
        !e.startsWith("/api/"),
      new i.NetworkFirst({
        cacheName: "pages-rsc-prefetch",
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      ({ request: i, url: { pathname: e }, sameOrigin: c }) =>
        "1" === i.headers.get("RSC") && c && !e.startsWith("/api/"),
      new i.NetworkFirst({
        cacheName: "pages-rsc",
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      ({ url: { pathname: i }, sameOrigin: e }) => e && !i.startsWith("/api/"),
      new i.NetworkFirst({
        cacheName: "pages",
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    i.registerRoute(
      ({ sameOrigin: i }) => !i,
      new i.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new i.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET",
    ),
    (self.__WB_DISABLE_DEV_LOGS = !0));
});
