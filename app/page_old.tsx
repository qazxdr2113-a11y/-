"use client";

import { useState } from "react";
import { saveLead } from "@/lib/storage";
import { Lead } from "@/types/Lead";


export default function Home() {


  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [mode,setMode] = useState("single");
  const [batchResults,setBatchResults] = useState<any[]>([]);
  function addToLeadList(){

    if(!result){
        return;
    }


    const lead:Lead = {

        id:Date.now(),

        url:result.url,

        platform:result.platform,

        score:result.score,

        level:result.level,

        createdAt:
        new Date().toLocaleDateString()

    };


    saveLead(lead);


    alert("已加入開發名單");

}

async function batchAnalyze(){

    const urls = url
        .split("\n")
        .filter(item => item.trim() !== "");


    const results = [];


    for(const item of urls){


        const response = await fetch(
            "/api/analyze",
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({
                    url:item
                })

            }
        );


        const data = await response.json();


        results.push(data);


    }


    console.log(results);

    setBatchResults(results);

}
  async function analyze(){


    const response = await fetch(
      "/api/analyze",
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          url:url
        })

      }
    );


    const data = await response.json();

    console.log(data);
    setResult(data);

  }



  return (

    <main className="min-h-screen bg-gray-100 p-10">


      <div className="max-w-5xl mx-auto">


        <h1 className="text-4xl font-bold text-green-600">

          PayLead Finder

        </h1>


        <p className="mt-2 text-gray-600">

          全支付商務開發名單搜尋系統

        </p>



        <div className="bg-white p-6 rounded-xl shadow mt-10">


          <h2 className="font-bold text-xl mb-4">

            網站平台分析

          </h2>



          <div className="flex gap-3">

            <div className="mb-4">

<button
onClick={()=>setMode("single")}
>
單一分析
</button>


<button
onClick={()=>setMode("batch")}
>
            批次分析
            </button>


            </div>
{
mode==="single" ? (

<input
className="border p-2"
placeholder="輸入網址"
value={url}
onChange={(e)=>setUrl(e.target.value)}
/>


):(


<textarea

className="border p-2 w-full"

rows={8}

placeholder={
`每行一個網址

https://abc.com
https://xyz.com`
}


value={url}

onChange={(e)=>setUrl(e.target.value)}


/>


)

}



<button
onClick={
    mode==="single"
    ? analyze
    : batchAnalyze
}
>
分析
</button>



          </div>



          {
            result && (

              <div className="mt-5 bg-green-50 p-5 rounded-lg">


                <h3 className="font-bold">

                  分析結果

                </h3>


                <p>

                  網址：
                  {result.url}

                </p>


                <p>

                  平台：
                  {result.platform}

                </p>


                <p>

                  信心度：
                  {result.confidence}%

                </p>
                <p className="mt-3">

商機評分：

{result.score}

分

</p>


<p>

開發優先：

{result.level}

</p>


<p className="mt-3 font-bold">

評分原因：

</p>


<ul>

{
(result.reasons || []).map(
(reason:string)=>(

<li key={reason}>

✓ {reason}

</li>

)

)

}

</ul>
                <p className="mt-3 font-bold">

判斷依據：
<button
onClick={addToLeadList}
className="mt-5 rounded bg-black px-4 py-2 text-white"
>

⭐ 加入開發名單

</button>
</p>


<ul>

{
(result.features || []).map(
(feature:string)=>(

<li key={feature}>

✓ {feature}

</li>

)

)

}

</ul>

              </div>

            )
          }



        </div>



      </div>


    </main>

  )

}