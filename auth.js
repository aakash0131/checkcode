const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const jwt_decode = require("jwt-decode");
const User = require('../../models/User');
const { createResponse } = require('../../utils/res');
const { jwtSecret, jwtSignInExpiresIn } = require('../../config/serverDynamicConfig.json');
const { isAzureAuth, isAzureWithoutAuth } = require('../../config/serverDynamicConfig.json');
const dynamicUsers = require('../../models/DynamicUsers');

router.post('/', (req, res) => {
    let decoded = jwt_decode(req.body.token);
    [req.body.username, req.body.email, req.body.password, req.body.tenantId, req.body.email2, req.body.azure_admin] =
        [decoded.username, decoded.email, decoded.password, decoded.tenantId, decoded.email2, decoded.azure_admin];
    User.findOne({ username: req.body.username }).then(async (user) => {
        if (user) {
            let payload = {
                id: user._id,
                username: req.body.username,
                email: req.body.email,
                tenantId: req.body.tenantId,
                email2: req.body.email2,
                userType: user.userType,
                isAzureAuth,
                isAzureWithoutAuth,
                azure_admin: req.body.azure_admin
            };
            User.findOneAndUpdate({ username: req.body.username.toString() }, { $set: { ...payload } }, { upsert: true }, function () {
                jwt.sign(payload, jwtSecret, { expiresIn: jwtSignInExpiresIn }, (err, token) => {
                    return createResponse(req, res, false, 'successfully logged-in', { token: 'Bearer ' + token });
                })
            })
        } else {
            return createResponse(req, res, false, 'username not found', {});
        }
    })
});

router.post('/checkAzureUser', async (req, res) => {
    try {
        const azureTenantModel = await dynamicUsers('azure_tenant');
        const response = await azureTenantModel.findOne({ shortname: req.body.shortname, email: req.body.email }).lean();
        return createResponse(req, res, false, 'success', response || {});
    } catch (error) {
        console.log(error);
        return createResponse(req, res, false, 'azure user not found', {});
    }
})

router.post('/config', async (req, res) => {
    if (req.body.shortname) {
        const dynamicModel = dynamicUsers('azure_shortname');
        const azureTenantModel = dynamicUsers('azure_tenant');
        const response = await dynamicModel.findOne({ shortname: req.body.shortname.toString() });
        const tenantInfo = await azureTenantModel.findOne({ shortname: req.body.shortname.toString() });
        if (response) {
            res.send({
                isAzureAuth,
                isAzureWithoutAuth,
                tenant: response ? { [req.body.shortname]: response } : {},
                tenantInfo,
                msg: ""
            })
        } else {
            res.status(400).send({
                isAzureAuth,
                isAzureWithoutAuth,
                tenant: {},
                tenantInfo: {},
                msg: "Shortname not found!"
            })
        }
    } else {
        res.send({
            isAzureAuth,
            isAzureWithoutAuth,
            tenant: {},
            tenantInfo: {},
            msg: ""
        })
    }
});

module.exports.router = router;
