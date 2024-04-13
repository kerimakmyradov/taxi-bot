import { Ctx, Hears, Message, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/scenes';
import { ScenesType } from '../scenes.type';
import { PassengerService } from '../../../passenger/passenger.service';
import { errorEditInfo, successEditPhone, WhatNumber } from '../../constatnts/message.constants';
import { ChatId } from '../../../decorators/getChatId.decorator';
import { passengerProfileKeyboard } from '../../keyboards/passenger-profile.keyboard';
import { TaxiBotContext } from '../../taxi-bot.context';
import { commonButtons } from '../../buttons/common.buttons';
import { TaxiBotCommonUpdate } from '../../updates/common.update';
import { TaxiBotValidation } from '../../taxi-bot.validation';

@Wizard(ScenesType.EditPhone)
export class EditPhoneScene {
	constructor(
		private readonly passengerService: PassengerService,
		private readonly taxiBotService: TaxiBotCommonUpdate,
		private readonly taxiBotValidation: TaxiBotValidation,
	) {}

	@WizardStep(1)
	async onSceneEnter(@Ctx() ctx: WizardContext): Promise<string> {
		await ctx.wizard.next();
		return WhatNumber;
	}

	@On('text')
	@WizardStep(2)
	async onPhone(
		@Ctx() ctx: WizardContext & TaxiBotContext,
		@Message() msg: { text: string },
		@ChatId() chatId: number,
	): Promise<string> {
		try {
			const valid = this.taxiBotValidation.isPhone(msg.text);
			if (valid === true) {
				await ctx.scene.leave();
				await this.passengerService.editPhone(chatId, msg.text);
				await ctx.reply(successEditPhone, passengerProfileKeyboard());
				ctx.session.user.phone = msg.text;
				return;
			}
			await ctx.reply(valid);
			return;
		} catch (e) {
			await ctx.scene.leave();
			await ctx.reply(errorEditInfo, passengerProfileKeyboard());
			return '';
		}
	}

	@Hears(commonButtons.back)
	async goHome(@Ctx() ctx: TaxiBotContext) {
		await this.taxiBotService.goHome(ctx);
	}
}
