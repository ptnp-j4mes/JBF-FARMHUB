import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';

dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.locale('th');

export default dayjs;
