import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import MarkdownIt from "markdown-it";

interface Props {
  /** require('../../assets/docs/whatever.md') */
  assetModule: any;
}

export default function MarkdownViewer({ assetModule }: Props) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // 1. Resolve and download the bundled MD asset
      const asset = Asset.fromModule(assetModule);
      await asset.downloadAsync();
      const md = await FileSystem.readAsStringAsync(asset.localUri!);
      // 2. Parse to HTML
      const mdParser = new MarkdownIt({
        html: false,
        linkify: true,
        typographer: true,
      });
      const body = mdParser.render(md);
      // 3. Wrap in a minimal HTML template
      const htmlDoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, Helvetica, Arial; padding: 16px; color: #333; }
              h1,h2,h3 { margin-top: 1.2em; }
              pre { background: #f4f4f4; padding: 8px; border-radius: 4px; }
              code { font-family: monospace; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>${body}</body>
        </html>
      `;
      setHtml(htmlDoc);
    }
    load();
  }, [assetModule]);

  if (!html) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <WebView originWhitelist={["*"]} source={{ html }} style={styles.webview} />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  webview: { flex: 1, backgroundColor: "transparent" },
});
