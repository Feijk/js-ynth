"use strict";

class JsyCheckBox extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({mode: "open"});
    const baseBox = document.createElement("div");
    baseBox.setAttribute("class", "baseBox");
    const toggleMark = document.createElement("div");
    toggleMark.setAttribute("class", "toggleMark");
    toggleMark.classList.add("hide");
    baseBox.appendChild(toggleMark);
    this.shadow = shadow;
    this.baseBox = baseBox;
    this.toggleMark = toggleMark;
    this.isOn = false;
    this.addEventListener("click", this.toggle);
    const style = document.createElement("style");
    style.textContent = `
    .baseBox {
      background-color: #016D71;
      width: 14px;
      height: 14px;
      display: inline-block;
      margin: 0;
      padding: 0;
      position: relative;
    }
    .toggleMark {
      background-color: #26DBC5;
      width: 6px;
      height: 6px;
      border: solid 1px #26DBC5;
      position: absolute;
      left: 3px;
      top: 3px;
      margin: 0;
      padding: 0;
    }
    .hide {
      //display: none;
      background-color: transparent;
    }
    `;
    shadow.appendChild(style);
    shadow.appendChild(baseBox);
  }

  toggle(e) {
    this.isOn ? this.toggleMark.classList.add("hide") : this.toggleMark.classList.remove("hide");
    this.isOn = !this.isOn;
    //console.log("clicked", this.isOn);
    //this.toggleMark.style.display === "block" ? "none" : "block";
  }

  get enabled() {
    return this.isOn;
  }
}
