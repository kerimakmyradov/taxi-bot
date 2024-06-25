import { Ctx, Hears, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/scenes';
import { ScenesType } from '../scenes.type';
import {
	errorEditInfo,
	successEditAccessOrderType,
	WhatAccessOrderType,
} from '../../constatnts/message.constants';
import { ChatId } from '../../../decorators/getChatId.decorator';
import { TaxiBotContext } from '../../taxi-bot.context';
import { CityService } from '../../../city/city.service';
import { GetQueryData } from '../../../decorators/getCityFromInlineQuery.decorator';
import { commonButtons } from '../../buttons/common.buttons';
import { TaxiBotCommonUpdate } from '../../updates/common.update';
import { DriverService } from '../../../driver/driver.service';
import { selectAccessOrderTypeKeyboard } from '../../keyboards/driver/select-access-order-type.keyboard';
import { Driver } from '../../../driver/driver.model';
import { AccessTypeOrder } from '../../../driver/Enum/access-type-order';
import { selectDriverKeyboard } from '../../keyboards/driver/select-driver-keyboard';
import { OrderService } from '../../../order/order.service';

@Wizard(ScenesType.EditAccessOrderTypeDriver)
export class EditAccessOrderTypeSceneDriver {
	constructor(
		private readonly driverService: DriverService,
		private readonly cityService: CityService,
		private readonly taxiBotService: TaxiBotCommonUpdate,
		private readonly orderService: OrderService,
	) {}

	@WizardStep(1)
	async onSceneEnter(@Ctx() ctx: WizardContext): Promise<string> {
		await ctx.reply(WhatAccessOrderType, selectAccessOrderTypeKeyboard());
		await ctx.wizard.next();
		return;
	}

	@On('callback_query')
	@WizardStep(2)
	async onCity(
		@Ctx() ctx: WizardContext & TaxiBotContext,
		@GetQueryData() accessOrderType: Driver['accessOrderType'],
		@ChatId() chatId: number,
	): Promise<string> {
		try {
			await ctx.scene.leave();
			if (Object.values(AccessTypeOrder).includes(accessOrderType)) {
				const { status } = await this.driverService.editAccessTypeOrder(chatId, accessOrderType);
				await ctx.reply(
					successEditAccessOrderType,
					await selectDriverKeyboard({ chatId, status }, this.orderService),
				);
			} else {
				await this.showError(ctx, chatId);
			}
			return '';
		} catch (e) {
			await ctx.scene.leave();
			await this.showError(ctx, chatId);
			return '';
		}
	}

	@Hears(commonButtons.back)
	async goHome(@Ctx() ctx: TaxiBotContext, @ChatId() chatId: number) {
		await this.taxiBotService.goHome(ctx, chatId);
	}

	async showError(@Ctx() ctx: WizardContext & TaxiBotContext, @ChatId() chatId: number) {
		const { status } = await this.driverService.findByChatId(chatId);
		await ctx.reply(
			errorEditInfo,
			await selectDriverKeyboard({ chatId, status }, this.orderService),
		);
	}
}
