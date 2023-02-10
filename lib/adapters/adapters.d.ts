import { AxiosAdapterConfig } from "../../index.cjs";

interface AdapterModule {
  getAdapter(adapters?: AxiosAdapterConfig[]): AxiosAdapterConfig;
  adapters: {
    http: AxiosAdapterConfig;
    xhr: AxiosAdapterConfig;
  };
}

declare const adapters: AdapterModule;
export default adapters;
