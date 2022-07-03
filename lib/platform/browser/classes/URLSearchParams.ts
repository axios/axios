'use strict';

import AxiosURLSearchParams from '../../../helpers/AxiosURLSearchParams';
export default typeof URLSearchParams !== 'undefined' ? URLSearchParams : AxiosURLSearchParams;
