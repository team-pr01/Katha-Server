import { Router } from "express";
import { AuthRoute } from "../modules/auth/auth.route";
import { AdminRoutes } from "../modules/admin/admin.route";
import { UserRoutes } from "../modules/users/users.route";
import { ProductRoutes } from "../modules/product/product.route";
import { OccasionRoutes } from "../modules/occasion/occasion.route";
import { CategoryRoutes } from "../modules/categories/categories.route";

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
    path: "/product",
    route: ProductRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
