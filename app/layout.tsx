import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SmartQuizzer - AI-Powered Adaptive Quiz Generator",
  description: "Transform your study materials into intelligent, adaptive quizzes with AI",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
                (function() {
                  try {
                    var polyfill = window.DOMMatrix || window.WebKitCSSMatrix || window.MSCSSMatrix || (function() {
                      function MockDOMMatrix() {
                        this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
                        this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
                        this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
                        this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
                        this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
                      }
                      MockDOMMatrix.prototype.toString = function() { return "matrix(1, 0, 0, 1, 0, 0)"; };
                      return MockDOMMatrix;
                    })();
                    window.DOMMatrix = polyfill;
                    if (typeof globalThis !== 'undefined') {
                      globalThis.DOMMatrix = polyfill;
                    }
                    if (typeof self !== 'undefined') {
                      self.DOMMatrix = polyfill;
                    }
                    console.log("[v0] Early DOMMatrix Check: Global availability secured");
                  } catch (e) {
                    console.error("[v0] Polyfill error:", e);
                  }
                })();
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
