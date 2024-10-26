


const addMember=async(req,res)=>{
    console.log("===AddMember==");
    console.log(req.body);
    console.log(req.tokenInfo);
    let info={
        'appName':req.APP_DB_COLLECTION,
        'createdAt':new Date().toISOString(),
        'createdByEmail':req.tokenInfo['email'],
        'clientDetails':req.tokenInfo
    }
    let data={
        "recentData":req.body,
        ...info
    }
    console.log(data);
    
    
    

}


module.exports={
    addMember
}