export function extractSiteName(html:string){


    // 找網站 title
    const titleMatch =
    html.match(
        /<title>(.*?)<\/title>/i
    );


    // 如果找到 title
    if(titleMatch){


        let title =
        titleMatch[1];


        // 去掉常見分隔符後面的文字

        title =
        title
        .split("|")[0]
        .split("-")[0]
        .trim();



        return title;


    }



    // 找不到 title

    return "未知網站";


}