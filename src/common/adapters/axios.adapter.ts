import axios, { AxiosInstance } from "axios";
import { HttpAdapter } from "../interfaces/http-adapter.interface";
import { Injectable } from "@nestjs/common";

// Para poder inyectar esta clase
@Injectable()
export class AxiosAdapter implements HttpAdapter {
  
  private axios: AxiosInstance = axios;

  async get<T>(url: string): Promise<T> {
    try {
      const { data } = await this.axios.get<T>( url );
      return data;
    } catch (error) {
      throw new Error('This is an error - Check logs');
    }
  }

}