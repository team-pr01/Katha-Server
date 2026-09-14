import httpStatus from "http-status";
import { HeroServices } from "./hero.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

const addHero = catchAsync(async (req, res) => {
    const file = req.file as Express.Multer.File | undefined;
    const result = await HeroServices.addHero(req.body, file);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Hero section added successfully",
        data: result,
    });
});

const getAllHeroesAdmin = catchAsync(async (req, res) => {
    const { search, isActive, skip = "0", limit = "10" } = req.query;

    const result = await HeroServices.getAllHeroesAdmin(
        { search, isActive },
        Number(skip),
        Number(limit)
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Hero sections fetched successfully",
        data: result,
    });
});

const getActiveHeroes = catchAsync(async (req, res) => {
    const result = await HeroServices.getActiveHeroes();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Active hero sections fetched successfully",
        data: result,
    });
});

const getSingleHero = catchAsync(async (req, res) => {
    const result = await HeroServices.getSingleHero(req.params.heroId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Hero section fetched successfully",
        data: result,
    });
});

const updateHero = catchAsync(async (req, res) => {
    const file = req.file as Express.Multer.File | undefined;
    const result = await HeroServices.updateHero(
        req.params.heroId,
        req.body,
        file
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Hero section updated successfully",
        data: result,
    });
});

const deleteHero = catchAsync(async (req, res) => {
    const result = await HeroServices.deleteHero(req.params.heroId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Hero section deleted successfully",
        data: result,
    });
});

const reorderHeroes = catchAsync(async (req, res) => {
    const result = await HeroServices.reorderHeroes(req.body.orders);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Hero sections reordered successfully",
        data: result,
    });
});

export const HeroControllers = {
    addHero,
    getAllHeroesAdmin,
    getActiveHeroes,
    getSingleHero,
    updateHero,
    deleteHero,
    reorderHeroes,
};