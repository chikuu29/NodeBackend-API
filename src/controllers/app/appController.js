

// const MongoDBManager = require('../../commonServices/mongoServices');
const {mongoClient}=require('../../services/mongoService')



// const mongoConfig = readJsonFiles('./config/mongoConfig.json');

const generateConfig=async(req,res)=>{

    try {
        // var refresh_token = req.cookies['refresh_token']
        const projectName = req.body.projectName;
        const app_config = await mongoClient.fetch("app_config", {type:"menu",id:1}, {});
        if(app_config.length!=0){
            // const message_info = { error: `User: ${userData.userName} already exists`, projectName, 'success': false, message: 'User already exists' };
            // logInfo({ ...message_info });
            const response={
                success:true,
                result:{'config':app_config[0]['config']}
            }
            return res.status(200).json(response);
        }else{
            return res.status(200).json({
                "success":false,
                "result":[]
            })
        }

        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
          });
        
    }

}


module.exports={
    generateConfig
}