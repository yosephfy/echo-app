import React from "react";
import MarkdownViewer from "../../components/MarkdownViewer";

export default function HelpScreen() {
  return (
    <MarkdownViewer assetModule={require("../../../assets/docs/help.md")} />
  );
}
