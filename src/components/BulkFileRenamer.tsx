import { useState } from "react";
import { Helmet } from "react-helmet-async";

interface ToolProps {
  triggerProcess: (msg: string, action: () => void) => void;
}

interface FilePreview {
  handle: any;
  oldName: string;
  newName: string;
}

export default function BulkFileRenamer({ triggerProcess }: ToolProps) {

  const [files, setFiles] = useState<FilePreview[]>([]);

  const [instructions, setInstructions] = useState(
`Rename everything using snake_case.

Remove words like final and copy.

Make names descriptive.`
  );

  const [loading, setLoading] = useState(false);


  const cleanFilename = (name:string) => {

    const dot = name.lastIndexOf(".");

    const filename =
      dot === -1 ? name : name.substring(0, dot);

    const extension =
      dot === -1 ? "" : name.substring(dot).toLowerCase();


    const cleaned = filename
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/copy\s*\(\d+\)|copy/gi, "")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");


    return cleaned + extension;
  };



  const selectFolder = async () => {

    try {

      setLoading(true);

      const folderHandle =
        await (window as any).showDirectoryPicker();


      triggerProcess(
        "Reading filenames...",
        async () => {


          const loadedFiles: FilePreview[] = [];


          for await (const [name, handle] of folderHandle.entries()) {


            if(handle.kind === "file") {

              loadedFiles.push({

                handle,

                oldName:name,

                newName:cleanFilename(name)

              });

            }

          }


          setFiles(loadedFiles);

          setLoading(false);

        }
      );


    } catch(error){

      console.error(error);

      setLoading(false);

    }

  };





  const runAI = async () => {


    if(files.length === 0){

      alert("Please select a folder first.");

      return;

    }


    try {


      setLoading(true);


      const names =
        files.map(file => file.oldName);



      const response = await fetch("/api/run-tool",{

        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({

          promptInstructions:
`
You are a file renaming assistant.

Return ONLY JSON.

Format:

[
 {
  "old":"old filename",
  "new":"new filename"
 }
]


Rules:

${instructions}

`,

          userInput:JSON.stringify(names)

        })

      });



      const data = await response.json();


      console.log("AI RESULT:",data);


      if(data.output){

        const result =
          JSON.parse(data.output);


        setFiles(prev =>

          prev.map(file=>{

            const match =
              result.find(
                (item:any)=>
                item.old === file.oldName
              );


            return {

              ...file,

              newName:
              match
              ? match.new
              : file.newName

            };


          })

        );


      }


    }
    catch(error){

      console.error(error);

      alert("AI generation failed.");

    }
    finally{

      setLoading(false);

    }


  };






  return (

<div>


<Helmet>

<title>Bulk File Renamer</title>

<meta
name="description"
content="Clean messy filenames instantly."
/>

</Helmet>



<h2 className="tool-header-title">
Bulk File Renamer
</h2>



<p
style={{
fontSize:"12px",
color:"#94a3b8",
marginBottom:"16px"
}}
>
Select a folder, describe how you want the files renamed, then let AI generate better filenames.
</p>




<textarea

className="textarea-input"

value={instructions}

onChange={(e)=>setInstructions(e.target.value)}

style={{
height:"100px",
marginBottom:"16px"
}}

/>





<button

className="btn-generate"

onClick={selectFolder}

disabled={loading}

>

{loading ? "Loading..." : "Select Folder"}

</button>




<button

className="btn-generate"

onClick={runAI}

disabled={loading}

style={{
marginTop:"12px"
}}

>

Generate AI Names

</button>






{files.length > 0 && (

<div

className="output-box"

style={{
marginTop:"20px"
}}

>


<div

style={{

display:"flex",

justifyContent:"space-between",

fontWeight:"bold",

borderBottom:"1px solid #334155",

paddingBottom:"8px"

}}

>

<span>
Current Filename
</span>


<span>
New Filename
</span>


</div>





{files.map((file,index)=>(


<div

key={index}

style={{

display:"flex",

justifyContent:"space-between",

padding:"8px 0",

borderBottom:"1px solid #1e293b",

fontSize:"12px"

}}

>


<span>
{file.oldName}
</span>


<span
style={{
color:"#2dd4bf"
}}
>
{file.newName}
</span>


</div>



))}


</div>

)}



</div>

  );

}