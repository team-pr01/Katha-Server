"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = require("../modules/auth/auth.route");
const admin_route_1 = require("../modules/admin/admin.route");
const users_route_1 = require("../modules/users/users.route");
const product_route_1 = require("../modules/product/product.route");
const occasion_route_1 = require("../modules/occasion/occasion.route");
const categories_route_1 = require("../modules/categories/categories.route");
const materials_route_1 = require("../modules/materials/materials.route");
const couponCode_route_1 = require("../modules/couponCode/couponCode.route");
const order_route_1 = require("../modules/order/order.route");
const personalizedOrder_route_1 = require("../modules/personalizedOrders/personalizedOrder.route");
const orderTracking_route_1 = require("../modules/orderTracking/orderTracking.route");
const address_route_1 = require("../modules/address/address.route");
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/auth",
        route: auth_route_1.AuthRoute,
    },
    {
        path: "/admin",
        route: admin_route_1.AdminRoutes,
    },
    {
        path: "/user",
        route: users_route_1.UserRoutes,
    },
    {
        path: "/user",
        route: users_route_1.UserRoutes,
    },
    {
        path: "/occasion",
        route: occasion_route_1.OccasionRoutes,
    },
    {
        path: "/category",
        route: categories_route_1.CategoryRoutes,
    },
    {
        path: "/materials",
        route: materials_route_1.MaterialRoutes,
    },
    {
        path: "/product",
        route: product_route_1.ProductRoutes,
    },
    {
        path: "/coupon-code",
        route: couponCode_route_1.CouponCodeRoutes,
    },
    {
        path: "/order",
        route: order_route_1.OrderRoutes,
    },
    {
        path: "/personalized-order",
        route: personalizedOrder_route_1.PersonalizedOrderRoutes,
    },
    {
        path: "/order-tracking",
        route: orderTracking_route_1.OrderTrackingRoutes,
    },
    {
        path: "/addresses",
        route: address_route_1.AddressRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
