import React from "react";
import MarkdownViewer from "../components/MarkdownViewer";

export default function AboutScreen() {
  return <MarkdownViewer assetModule={require("../../assets/docs/about.md")} />;
}
