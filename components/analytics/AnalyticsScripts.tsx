"use client";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

const GA = process.env.NEXT_PUBLIC_GA_ID;
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** Loads GA4 / Meta Pixel only when their IDs are configured, and emits page_view on route change. */
export function AnalyticsScripts() {
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    const path = pathname + (params.toString() ? `?${params}` : "");
    track("page_view", { page_path: path });
    window.gtag?.("event", "page_view", { page_path: path });
    window.fbq?.("track", "PageView");
  }, [pathname, params]);

  return (
    <>
      {GA && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA}',{send_page_view:false});`}</Script>
        </>
      )}
      {PIXEL && (
        <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL}');`}</Script>
      )}
    </>
  );
}

/** Fire a one-off analytics event when a server-rendered page mounts. */
export function TrackOnMount({ event, props }: { event: Parameters<typeof track>[0]; props?: Parameters<typeof track>[1] }) {
  useEffect(() => { track(event, props); }, [event, props]);
  return null;
}
