import _ from "lodash";
import css from "./style.css";
import BpmnModeler from "bpmn-js/lib/Modeler";
import AutoLayout from "./bpmn-auto-layout/AutoLayout";

function initForm() {
    document
        .getElementById("file")
        .addEventListener("change", function (event) {
            let file = document.getElementById("file").files[0];
            if (file) {
                let reader = new FileReader();
                reader.readAsText(file, "UTF-8");
                reader.onload = function (evt) {
                    bpmnViewer.reloadView(evt.target.result);
                };
                reader.onerror = function (evt) {
                    console.log("error reading file");
                };
            }
        });

    document
        .getElementById("exportBtn")
        .addEventListener("click", async function (event) {
            let result = await bpmnViewer.viewer._moddle.toXML(
                bpmnViewer.viewer._definitions,
                { format: true }
            );

            var element = document.createElement('a');
            element.setAttribute('href', 'data:application/xml;charset=utf-8,' + encodeURIComponent(result.xml));
            element.setAttribute('download', "diagram.bpmn");

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        });

    document
        .getElementById("genLayout")
        .addEventListener("click", async function (event) {
            let result = await bpmnViewer.viewer._moddle.toXML(
                bpmnViewer.viewer._definitions,
                { format: true }
            );

            let layoutResult = await fetch("/api/layout", {
                method: "POST",
                body: result.xml,
                headers: new Headers({ "content-type": "application/xml" }),
            });
            let layout = await layoutResult.json();
            bpmnViewer.reloadView(layout.xml_content);
        });
}

var bpmnViewer = (function () {
    return {
        viewer: new BpmnModeler({
            container: "#canvas",
            keyboard: {
                bindTo: document,
            },
        }),

        layouter: new AutoLayout(),

        reloadView: async function (xml) {
            const result = await this.viewer.importXML(xml);
            let canvas = this.viewer.get("canvas");
            canvas.zoom("fit-viewport");
            canvas.zoom(0.8 * canvas._cachedViewbox.scale);
        },
    };
})();

bpmnViewer.reloadView(`<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="sid-38422fae-e03e-43a3-bef4-bd33b32041b2" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="8.8.3">
  <process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="BpmnDiagram_1">
    <bpmndi:BPMNPlane id="BpmnPlane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</definitions>
`);

initForm();
