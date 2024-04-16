import { Module } from '@nestjs/common';
import { PassengerModule } from '../passenger/passenger.module';
import { DriverModule } from '../driver/driver.module';
import { CityModule } from '../city/city.module';
import { TaxiBotCommonUpdate } from './updates/common.update';
import { TaxiBotPassengerUpdate } from './updates/passenger.update';
import { SettingsModule } from '../settings/settings.module';
import { AddAddressScene } from './scenes/passenger/add-address.scene';
import { RegisterPassengerScene } from './scenes/passenger/registration-passenger.scene';
import { DeleteAddressScene } from './scenes/passenger/delete-address.scene';
import { EditNameScene } from './scenes/passenger/edit-name.scene';
import { EditCityScene } from './scenes/passenger/edit-city.scene';
import { EditPhoneScene } from './scenes/passenger/edit-phone.scene';
import { CreateOrderScene } from './scenes/passenger/create-order.scene';
import { OrderModule } from '../order/order.module';
import { TaxiBotValidation } from './taxi-bot.validation';
import { RegisterDriverScene } from './scenes/driver/registration-driver.scene';
import { TaxiBotDriverUpdate } from './updates/driver.update';
import { EditCitySceneDriver } from './scenes/driver/edit-city.scene';
import { EditPhoneSceneDriver } from './scenes/driver/edit-phone.scene';
import { EditNameSceneDriver } from './scenes/driver/edit-name.scene';
import { EditCarSceneDriver } from './scenes/driver/edit-car.scene';
import { EditAccessOrderTypeSceneDriver } from './scenes/driver/edit-access-order-type.scene';
import { BargainOrderScene } from './scenes/driver/bargain-order.scene';
import { AccessOrderScene } from './scenes/driver/access-order.scene';

@Module({
	imports: [PassengerModule, DriverModule, CityModule, SettingsModule, OrderModule],
	providers: [
		RegisterDriverScene,
		RegisterPassengerScene,
		AddAddressScene,
		DeleteAddressScene,
		EditNameScene,
		EditPhoneScene,
		EditCityScene,
		BargainOrderScene,
		AccessOrderScene,
		EditNameSceneDriver,
		EditCarSceneDriver,
		EditAccessOrderTypeSceneDriver,
		EditPhoneSceneDriver,
		EditCitySceneDriver,
		CreateOrderScene,
		TaxiBotCommonUpdate,
		TaxiBotPassengerUpdate,
		TaxiBotDriverUpdate,
		TaxiBotValidation,
	],
})
export class TaxiBotModule {}
