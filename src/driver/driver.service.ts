import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Driver, DriverDocument } from './driver.model';
import { Model } from 'mongoose';
import { CreateDriverDto } from './dto/create-driver.dto';
import { StatusDriver } from '../taxi-bot/types/status-driver.type';
import { InjectBot } from 'nestjs-telegraf';
import { BotName } from '../types/bot-name.type';
import { Telegraf } from 'telegraf';
import { TaxiBotContext } from '../taxi-bot/taxi-bot.context';
import { Order } from '../order/order.model';
import { Queue } from 'bull';
import { QueueTaskType, QueueType } from '../types/queue.type';
import { InjectQueue } from '@nestjs/bull';
import { AccessTypeOrder } from './Enum/access-type-order';
import { NotDrivers } from '../taxi-bot/constatnts/message.constants';
import { BlockedType } from './Enum/blocked-type';
import { QueryType, ResponseType } from '../types/query.type';
import { getFullDriverInfoPipeline } from './pipelines/getFullDriverInfo.pipeline';

@Injectable()
export class DriverService {
	constructor(
		@InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
		@InjectBot(BotName.Taxi) private readonly bot: Telegraf<TaxiBotContext>,
		@InjectQueue(QueueType.Order) private readonly orderQueue: Queue,
	) {}

	async create(dto: CreateDriverDto) {
		return this.driverModel.create(dto);
	}

	async unlockedUser(chatId: number) {
		return this.driverModel.findOneAndUpdate(
			{ chatId },
			{
				isBlocked: false,
				blockedType: BlockedType.No,
			},
		);
	}

	async lockedUser(chatId: number, blockedType: BlockedType = BlockedType.NotPaid) {
		return this.driverModel.findOneAndUpdate(
			{ chatId },
			{
				status: StatusDriver.Offline,
				isBlocked: true,
				blockedType,
			},
		);
	}

	async switchBusyByChatId(chatId: number, isBusy: boolean) {
		return this.driverModel.findOneAndUpdate({ chatId }, { isBusy });
	}

	async downgradeRating(chatId: number) {
		const updatedDriver = await this.driverModel.findOne({ chatId });
		updatedDriver.priority = updatedDriver.priority - 3;
		if (updatedDriver.priority < 0) {
			updatedDriver.priority = 0;
		}

		await updatedDriver.save();

		return updatedDriver;
	}

	async upgradeRating(chatId: number) {
		const updatedDriver = await this.driverModel.findOne({ chatId });
		updatedDriver.priority += 1;
		if (updatedDriver.priority > 10) {
			updatedDriver.priority = 10;
		}

		await updatedDriver.save();

		return updatedDriver;
	}

	async findByChatId(chatId: number) {
		return await this.driverModel.findOne({ chatId }).exec();
	}

	async toggleStatusByChatId(chatId: number) {
		return this.driverModel
			.findOneAndUpdate(
				{ chatId },
				[
					{
						$set: {
							status: {
								$switch: {
									branches: [
										{ case: { $eq: ['$status', StatusDriver.Online] }, then: StatusDriver.Offline },
										{ case: { $eq: ['$status', StatusDriver.Offline] }, then: StatusDriver.Online },
									],
									default: '$status',
								},
							},
						},
					},
				],

				{ new: true },
			)
			.exec();
	}

	async editName(chatId: Driver['chatId'], new_name: Driver['first_name']) {
		return this.driverModel.findOneAndUpdate(
			{ chatId },
			{
				$set: {
					first_name: new_name,
				},
			},
		);
	}

	async editPhone(chatId: Driver['chatId'], new_phone: Driver['phone']) {
		return this.driverModel.findOneAndUpdate(
			{ chatId },
			{
				$set: {
					phone: new_phone,
				},
			},
		);
	}

	async editCity(chatId: Driver['chatId'], new_city: Driver['city']) {
		return this.driverModel.findOneAndUpdate(
			{ chatId },
			{
				$set: {
					city: new_city,
				},
			},
		);
	}

	async editAccessTypeOrder(chatId: Driver['chatId'], new_access_type: Driver['accessOrderType']) {
		return this.driverModel.findOneAndUpdate(
			{ chatId },
			{
				$set: {
					accessOrderType: new_access_type,
				},
			},
		);
	}

	async editCar(chatId: Driver['chatId'], new_car: Driver['car']) {
		return this.driverModel.findOneAndUpdate(
			{ chatId },
			{
				$set: {
					car: new_car,
				},
			},
		);
	}

	async sendBulkOrder(order: Order, passengerRating: string) {
		const drivers = await this.driverModel.find({
			status: StatusDriver.Online,
			isBlocked: false,
			city: order.city,
			$or: [{ accessOrderType: AccessTypeOrder.ALL }, { accessOrderType: order.type }],
		});
		if (!drivers.length) {
			await this.bot.telegram.sendMessage(order.passengerId, NotDrivers);
			return;
		}

		await Promise.all(
			drivers.map(async (driver) => {
				await this.orderQueue.add(
					QueueTaskType.SendOrderToDrivers,
					{ driver, order, passengerRating },
					// { delay: 100 },
				);
			}),
		);
	}

	async addRating(chatId: number, rating: number) {
		return this.driverModel.findOneAndUpdate(
			{ chatId },
			{ $push: { rating: { $each: [rating], $position: 0 } } },
			{ new: true },
		);
	}

	async getAllDriversId() {
		return this.driverModel.find({}, 'chatId').exec();
	}

	async getLimitAll(
		currentPageInQuery?: QueryType['currentPage'],
	): Promise<ResponseType<Driver[]>> {
		const perPageCount = 10;
		const currentPage = Number(currentPageInQuery) || 1;
		const skip = perPageCount * (currentPage - 1);

		const drivers: Driver[] = await this.driverModel
			.find()
			.sort({ createdAt: -1 })
			.limit(perPageCount)
			.skip(skip);
		const total = await this.driverModel.countDocuments();

		return { data: drivers, total, currentPage, perPageCount };
	}

	async getAll() {
		return this.driverModel.find().sort({ createdAt: -1 });
	}

	async getFullDriverInfo(chatId: number) {
		return (
			await this.driverModel.aggregate(getFullDriverInfoPipeline(chatId)).exec()
		)[0] as Driver & {
			receivedReview: number;
			leftReview: number;
		};
	}

	async update(chatId: number, updatedDriver: Partial<Driver>) {
		return this.driverModel
			.findOneAndUpdate({ chatId }, { $set: updatedDriver }, { new: true })
			.exec();
	}
}
