import { regionService } from '../features/regions/region.service';
import { incidentService } from '../features/incidents/incident.service';
import { rainfallService } from '../features/rainfall/rainfall.service';
import { warningService } from '../features/warnings/warning.service';
import { stationService } from '../features/stations/station.service';

export const dataProvider = {
  regions: regionService,
  incidents: incidentService,
  rainfall: rainfallService,
  warnings: warningService,
  stations: stationService,
};
