export function calculateScore(
    platform:string,
    html:string
){


let score = 0;

let reasons:string[] = [];


const content = html.toLowerCase();




// 平台判斷

if(platform !== "Unknown"){

    score += 30;

    reasons.push(
        "使用電商平台"
    );

}



// 平台價值

if(
platform==="SHOPLINE" ||
platform==="Shopify" ||
platform==="Cyberbiz" ||
platform==="91APP"
){

    score +=10;

    reasons.push(
        "主流電商平台"
    );

}




// 商品頁

if(
content.includes("product") ||
content.includes("商品") ||
content.includes("item")
){

    score+=15;

    reasons.push(
        "有商品頁"
    );

}



// 購物車

if(
content.includes("cart") ||
content.includes("checkout") ||
content.includes("購物車")
){

    score+=15;

    reasons.push(
        "找到購物車功能"
    );

}



// 會員

if(
content.includes("login") ||
content.includes("member") ||
content.includes("會員")
){

    score+=10;

    reasons.push(
        "有會員功能"
    );

}



// 聯絡方式

if(
content.includes("contact") ||
content.includes("聯絡") ||
content.includes("tel")
){

    score+=5;

    reasons.push(
        "有聯絡方式"
    );

}




// 支付判斷


if(
!content.includes("line pay") &&
!content.includes("街口") &&
!content.includes("apple pay")
){

    score+=15;

    reasons.push(
        "尚未發現多元支付"
    );

}




if(content.includes("line pay")){

    score+=5;

    reasons.push(
        "已有 LINE Pay"
    );

}



if(content.includes("apple pay")){

    score+=5;

    reasons.push(
        "已有 Apple Pay"
    );

}




let level="低優先";


if(score>=80){

    level="高優先";

}
else if(score>=50){

    level="中優先";

}




return {

score,

level,

reasons

};


}