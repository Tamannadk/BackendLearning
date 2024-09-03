const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// 𝗰𝗼𝗻𝘀𝘁 𝗮𝘀𝘆𝗻𝗰𝗛𝗮𝗻𝗱𝗹𝗲𝗿=(𝗳𝗻)=>𝗮𝘀𝘆𝗻𝗰(𝗿𝗲𝗾,𝗿𝗲𝘀,𝗻𝗲𝘅𝘁)=>{
//    𝘁𝗿𝘆 {
//     𝗮𝘄𝗮𝗶𝘁 𝗳𝗻(𝗿𝗲𝗾,𝗿𝗲𝘀,𝗻𝗲𝘅𝘁)
//    } 𝗰𝗮𝘁𝗰𝗵 (𝗲𝗿𝗿𝗼𝗿) {
//     𝗰𝗼𝗻𝘀𝗼𝗹𝗲.𝗹𝗼𝗴(𝗲𝗿𝗿𝗼𝗿.𝗰𝗼𝗱𝗲 || 𝟱𝟬𝟬).𝗷𝘀𝗼𝗻({
//         𝘀𝘂𝗰𝗰𝗲𝘀𝘀:𝗳𝗮𝗹𝘀𝗲,
//         𝗺𝗲𝘀𝘀𝗮𝗴𝗲:𝗲𝗿𝗿𝗼𝗿.𝗺𝗲𝘀𝘀𝗮𝗴𝗲
//     })
//    }
// }
