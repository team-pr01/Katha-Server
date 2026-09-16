import { Router } from "express";
import { AuthRoute } from "../modules/auth/auth.route";
import { AdminRoutes } from "../modules/admin/admin.route";
import { UserRoutes } from "../modules/users/users.route";
import { ProductRoutes } from "../modules/product/product.route";
import { OccasionRoutes } from "../modules/occasion/occasion.route";
import { CategoryRoutes } from "../modules/categories/categories.route";
import { MaterialRoutes } from "../modules/materials/materials.route";
import { CouponCodeRoutes } from "../modules/couponCode/couponCode.route";
import { OrderRoutes } from "../modules/order/order.route";
import { PersonalizedOrderRoutes } from "../modules/personalizedOrders/personalizedOrder.route";
import { OrderTrackingRoutes } from "../modules/orderTracking/orderTracking.route";
import { AddressRoutes } from "../modules/address/address.route";
import { HeroRoutes } from "../modules/hero/hero.route";
import { ProductVariantRoutes } from "../modules/product/productVariant/productVariant.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoute,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/occasion",
    route: OccasionRoutes,
  },
  {
    path: "/category",
    route: CategoryRoutes,
  },
  {
    path: "/materials",
    route: MaterialRoutes,
  },
  {
    path: "/product",
    route: ProductRoutes,
  },
  {
    path: "/variant",
    route: ProductVariantRoutes,
  },
  {
    path: "/coupon-code",
    route: CouponCodeRoutes,
  },
  {
    path: "/order",
    route: OrderRoutes,
  },
  {
    path: "/personalized-order",
    route: PersonalizedOrderRoutes,
  },
  {
    path: "/order-tracking",
    route: OrderTrackingRoutes,
  },
  {
    path: "/addresses",
    route: AddressRoutes,
  },
  {
    path: "/addresses",
    route: AddressRoutes,
  },
  {
    path: "/hero",
    route: HeroRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
