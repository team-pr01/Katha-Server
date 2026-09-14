"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeroControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const hero_service_1 = require("./hero.service");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const addHero = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    const result = yield hero_service_1.HeroServices.addHero(req.body, file);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Hero section added successfully",
        data: result,
    });
}));
const getAllHeroesAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, isActive, skip = "0", limit = "10" } = req.query;
    const result = yield hero_service_1.HeroServices.getAllHeroesAdmin({ search, isActive }, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Hero sections fetched successfully",
        data: result,
    });
}));
const getActiveHeroes = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield hero_service_1.HeroServices.getActiveHeroes();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Active hero sections fetched successfully",
        data: result,
    });
}));
const getSingleHero = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield hero_service_1.HeroServices.getSingleHero(req.params.heroId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Hero section fetched successfully",
        data: result,
    });
}));
const updateHero = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    const result = yield hero_service_1.HeroServices.updateHero(req.params.heroId, req.body, file);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Hero section updated successfully",
        data: result,
    });
}));
const deleteHero = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield hero_service_1.HeroServices.deleteHero(req.params.heroId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Hero section deleted successfully",
        data: result,
    });
}));
const reorderHeroes = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield hero_service_1.HeroServices.reorderHeroes(req.body.orders);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Hero sections reordered successfully",
        data: result,
    });
}));
exports.HeroControllers = {
    addHero,
    getAllHeroesAdmin,
    getActiveHeroes,
    getSingleHero,
    updateHero,
    deleteHero,
    reorderHeroes,
};
