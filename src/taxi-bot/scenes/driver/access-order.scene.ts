import { Ctx, Hears, InjectBot, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/scenes';
import { ScenesType } from '../scenes.type';
import {
	driverOffer,
	errorValidation,
	successfulProposalSubmissionText,
	timeDeliveryText,
} from '../../constatnts/message.constants';
import { ChatId } from '../../../decorators/getChatId.decorator';
import { TaxiBotContext } from '../../taxi-bot.context';
import { CityService } from '../../../city/city.service';
import { GetQueryData } from '../../../decorators/getCityFromInlineQuery.decorator';
import { commonButtons } from '../../buttons/common.buttons';
import { TaxiBotCommonUpdate } from '../../updates/common.update';
import { DriverService } from '../../../driver/driver.service';
import { AcceptanceOrderByDriverContext } from '../../contexts/AcceptanceOrderByDriver.context';
import { timeDriverKeyboard } from '../../keyboards/driver/time-driver.keyboard';
import { BotName } from '../../../types/bot-name.type';
import { Telegraf } from 'telegraf';
import { driverOfferKeyboard } from '../../keyboards/passenger/driver-offer.keyboard';
import { driverProfileKeyboard } from '../../keyboards/driver/profile.keyboard';

@Wizard(ScenesType.AccessOrderByDriver)
export class AccessOrderScene {
	constructor(
		private readonly driverService: DriverService,
		private readonly cityService: CityService,
		private readonly taxiBotService: TaxiBotCommonUpdate,
		@InjectBot(BotName.Taxi) private readonly bot: Telegraf<TaxiBotContext>,
	) {}

	@WizardStep(1)
	async onSceneEnter(
		@Ctx() ctx: WizardContext & TaxiBotContext & AcceptanceOrderByDriverContext,
	): Promise<string> {
		ctx.wizard.state.orderId = ctx.session.acceptedOrder.orderId;
		ctx.wizard.state.passengerId = ctx.session.acceptedOrder.passengerId;
		await ctx.reply(timeDeliveryText, timeDriverKeyboard());
		await ctx.wizard.next();
		return;
	}

	@On('callback_query')
	@WizardStep(2)
	async onSelectTime(
		@Ctx() ctx: WizardContext & TaxiBotContext & AcceptanceOrderByDriverContext,
		@GetQueryData() time: string,
		@ChatId() chatId: number,
	): Promise<string> {
		const numberTime = Number(time);
		if (numberTime > 0 && numberTime < 30) {
			const driver = await this.driverService.findByChatId(chatId);
			await this.bot.telegram.sendMessage(
				ctx.wizard.state.passengerId,
				driverOffer(driver, numberTime),
				{
					parse_mode: 'HTML',
					reply_markup: driverOfferKeyboard(ctx.wizard.state.orderId, driver.chatId, numberTime),
				},
			);
			await ctx.reply(successfulProposalSubmissionText, driverProfileKeyboard(driver.status));
			await ctx.scene.leave();
			return;
		}
		await ctx.reply(errorValidation);
		return;
	}

	@Hears(commonButtons.back)
	async goHome(@Ctx() ctx: TaxiBotContext, @ChatId() chatId: number) {
		await this.taxiBotService.goHome(ctx, chatId);
	}
}
