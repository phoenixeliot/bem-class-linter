import "./App.css";
import React from "react";
import _ from "lodash";

const bemPartsRegex =
  /^(?<block>[a-zA-Z0-9\\-]+)(?<element>__[a-zA-Z0-9\\-]*)?(?<modifier>_[a-zA-Z0-9\\-]*)?(?<value>_[a-zA-Z0-9\\-]*)?$/;

const keys = ["unknown", "block", "element", "modifier", "value"];

/**
 * Abstracts the 4 parts of a BEM classname for comparison and convenient modificationn
 */
class BemItem {
  constructor(obj) {
    Object.assign(this, obj);
  }
  isEqual(other) {
    return (
      this.block == other.block &&
      this.element == other.element &&
      this.modifier == other.modifier &&
      this.value == other.value
    );
  }
  getUnmodifiedItem() {
    return Object.assign(new BemItem(), this, { modifier: "", value: "" });
  }
  getBlock() {
    return Object.assign(new BemItem(), this.getUnmodifiedItem(), {
      element: "",
    });
  }
  toString() {
    if (this.unknown) {
      return this.unknown;
    } else {
      return this.block + this.element + this.modifier + this.value;
    }
  }
  static fromClassName(className) {
    const partsRegex =
      /^(?<block>[a-zA-Z0-9\\-]+)(?<element>__[a-zA-Z0-9\\-]*)?(?<modifier>_[a-zA-Z0-9\\-]*)?(?<value>_[a-zA-Z0-9\\-]*)?$/;
    const match = className.match(partsRegex);
    if (match === null) {
      return new BemItem({
        block: "",
        element: "",
        modifier: "",
        value: "",
        unknown: className,
      });
    }
    const parts = match.groups;
    const plainParts = Object.assign(new BemItem(), parts); // Make it serializable
    keys.forEach((key) => {
      plainParts[key] = plainParts[key] || "";
    });
    return plainParts;
  }
}

function lintForInvalidBemNames(nodes) {
  for (let node of nodes) {
    const bemList = Array.from(node.classList).map(BemItem.fromClassName);
    for (let bemItem of bemList) {
      if (bemItem.unknown) {
        console.error(`Class is not a valid BEM name: ${bemItem.toString()}`);
      }
    }
  }
}

/**
 * Prints errors for any BEM class modifiers used in the HTML without the unmodified BEM name in the same classList
 * @param {*} nodes
 */
function lintForModifierWithoutBase(nodes) {
  for (let node of nodes) {
    const bemList = Array.from(node.classList).map(BemItem.fromClassName);
    for (let bemItem of bemList) {
      if (bemItem.modifier) {
        const bemItemWithoutModifier = bemItem.getUnmodifiedItem();
        if (
          !bemList.some((potentialBaseBemItem) => {
            return bemItemWithoutModifier.isEqual(potentialBaseBemItem);
          })
        ) {
          console.error(
            `BEM modifier ${bemItem.toString()} has no accompanying base class`
          );
        }
      }
    }
  }
}

/**
 * Iterates up from a node through its ancestors, stopping at #document
 * @param {HTMLElement} node - The node to start searching from (not included in the results)
 */
function* ancestorNodes(node) {
  let nextAncestor = node.parentNode;
  while (true) {
    if (!nextAncestor.tagName) {
      // quick and dirty way to stop at #document
      break;
    }
    yield nextAncestor;
    nextAncestor = nextAncestor.parentNode;
  }
}

function lintForElementsOutsideBlocks(nodes) {
  for (let childNode of nodes) {
    const childBemList = Array.from(childNode.classList).map(
      BemItem.fromClassName
    );
    for (let childBemItem of childBemList) {
      if (childBemItem.element) {
        // find parent htmlelements that are its corresponding block
        let foundBlockAncestor = false;
        for (let ancestor of ancestorNodes(childNode)) {
          const parentBemList = Array.from(ancestor.classList).map(
            BemItem.fromClassName
          );
          if (
            parentBemList.some((parentBemItem) => {
              return parentBemItem.isEqual(childBemItem.getBlock());
            })
          ) {
            foundBlockAncestor = true;
            break;
          }
        }
        if (!foundBlockAncestor) {
          console.error(
            `BEM Element found outside of its block: ${childBemItem.toString()}`
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
    lintForInvalidBemNames(nodesWithClasses);
    lintForModifierWithoutBase(nodesWithClasses);
    lintForElementsOutsideBlocks(nodesWithClasses);
  }
  return (
    <div className="App">
      <div>
        <div>Paste your html here:</div>
        <textarea ref={htmlInputRef}></textarea>
      </div>
      <div>
        <button onClick={handleClickLint}>Lint!</button>
      </div>
    </div>
  );
}

export default App;
