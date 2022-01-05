import os

import bpmn_python.bpmn_diagram_rep as diagram
import bpmn_python.bpmn_diagram_layouter as layouter
from logic.get_xml_file import get_xml_file
from logic.bpmn_builder import DataColumns
from flask import Flask, request, flash, url_for, json
from werkzeug.utils import redirect, secure_filename

UPLOAD_FOLDER = "file_uploads"
ALLOWED_EXTENSIONS = {"xml", "bpmn"}
app = Flask(__name__, static_url_path="")
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/")
def hello_world():
    return app.send_static_file("index.html")


@app.route("/api/upload", methods=["POST"])
def upload_file():
    if request.method == "POST":        
        if "file" not in request.files:
            return {"error": "No file part"}, 400

        file = request.files["file"]

        if file.filename == "":
            return {"error": "No selected file"}, 400
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)            
            file.save(file_path)
            dataColumns = DataColumns(
                id_col=request.form["idColumn"]
                if request.form["idColumn"]
                and len(request.form["idColumn"].strip()) != 0
                else "Case ID",
                datetime_col=request.form["timestampColumn"]
                if request.form["timestampColumn"]
                and len(request.form["timestampColumn"]) != 0
                else "Start Timestamp",
                activity_col=request.form["activityColumn"]
                if request.form["activityColumn"]
                and len(request.form["activityColumn"]) != 0
                else "Activity",
            )
            separator = request.form["separator"] if request.form["separator"] and len(request.form["separator"]) != 0 else ","
            xml_file_content = get_xml_file(file_path, dataColumns, separator)
            return {"xml_content": xml_file_content}, 200
        return

# gets bpmn xml and sends back xml with layout
@app.route("/api/layout", methods=["POST"])
def gen_layout():
    if request.method == "POST":
        with open("diagram.xml","w+") as f:
            f.write(request.data.decode("utf-8"))
        bpmn_diagram = diagram.BpmnDiagramGraph()
        bpmn_diagram.load_diagram_from_xml_file("diagram.xml")
        layouter.generate_layout(bpmn_diagram)
        bpmn_diagram.export_xml_file("./", "diagram.xml")
        with open("diagram.xml","r") as f:
            xml_content = f.read()
        return {"xml_content": xml_content}, 200
    return