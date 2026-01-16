import jwt from "jsonwebtoken";

// Hospital authentication middleware
const hospitalAuth = async (req, res, next) => {
    try {
        const { htoken } = req.headers;

        if (!htoken) {
            return res.json({ success: false, message: 'Not Authorized. Login Again' });
        }

        const token_decode = jwt.verify(htoken, process.env.JWT_SECRET);
        req.body.hospitalId = token_decode.id;

        next();
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export default hospitalAuth;
