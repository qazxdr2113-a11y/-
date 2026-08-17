"use client";


import { useEffect, useState } from "react";

import { getLeads } from "@/lib/storage";

import { Lead } from "@/types/Lead";



export default function LeadsPage(){


    const [leads,setLeads] = useState<Lead[]>([]);



    useEffect(()=>{

        setLeads(
            getLeads()
        );

    },[]);



    return (

        <main className="p-8">


            <h1 className="text-3xl font-bold">

                我的開發名單

            </h1>



            <div className="mt-6 space-y-4">


            {
                leads.map((lead)=>(


                    <div
                    key={lead.id}
                    className="border rounded p-4"
                    >


                        <h2 className="text-xl font-bold">

                            {lead.url}

                        </h2>


                        <p>

                            平台：
                            {lead.platform}

                        </p>


                        <p>

                            商機分數：
                            {lead.score}

                        </p>


                        <p>

                            優先級：
                            {lead.level}

                        </p>


                    </div>


                ))
            }


            </div>


        </main>

    );

}