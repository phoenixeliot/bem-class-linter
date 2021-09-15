import "./App.css";
import React from "react";
import _ from "lodash";

const bemPartsRegex =
  /^(?<block>[a-zA-Z0-9\\-]+)(?<element>__[a-zA-Z0-9\\-]*)?(?<modifier>_[a-zA-Z0-9\\-]*)?(?<value>_[a-zA-Z0-9\\-]*)?$/;

const keys = ["unknown", "block", "element", "modifier", "value"];

class BemItem {
  isEqual(other) {
    return (
      this.block == other.block &&
      this.element == other.element &&
      this.modifier == other.modifier &&
      this.value == other.value
    );
  }
  toString() {
    return this.block + this.element + this.modifier + this.value;
  }
}

const parseClass = (text) => {
  const partsRegex =
    /^(?<block>[a-zA-Z0-9\\-]+)(?<element>__[a-zA-Z0-9\\-]*)?(?<modifier>_[a-zA-Z0-9\\-]*)?(?<value>_[a-zA-Z0-9\\-]*)?$/;
  const match = text.match(partsRegex);
  if (match === null) {
    return { block: "", element: "", modifier: "", value: "", unknown: text };
  }
  const parts = match.groups;
  const plainParts = Object.assign(new BemItem(), parts); // Make it serializable
  keys.forEach((key) => {
    plainParts[key] = plainParts[key] || "";
  });
  return plainParts;
};

function lintForModifierWithoutBase(nodesWithClasses) {
  for (let node of nodesWithClasses) {
    const classList = node.classList;
    const bemList = Array.from(classList).map(parseClass);
    for (let bemItem of bemList) {
      if (bemItem.modifier) {
        const bemItemWithoutModifier = Object.assign(new BemItem(), bemItem, {
          modifier: "",
          value: "",
        });
        if (
          !bemList.some((potentialBaseBemItem) => {
            return bemItemWithoutModifier.isEqual(potentialBaseBemItem);
          })
        ) {
          console.log(
            `BEM modifier ${bemItem.toString()} has no accompanying base class`
          );
        }
      }
    }
  }
}

function App() {
  const htmlInputRef = React.useRef();
  function handleClickLint() {
    const html = htmlInputRef.current.value;
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(html, "text/html");
    const nodesWithClasses = htmlDoc.querySelectorAll("[class]");
    lintForModifierWithoutBase(nodesWithClasses);
  }
  return (
    <div className="App">
      Paste your html here:
      <textarea ref={htmlInputRef}></textarea>
      <button onClick={handleClickLint}>Lint!</button>
    </div>
  );
}

export default App;
