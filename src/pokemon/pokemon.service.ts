import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon, PokemonDocument } from './entities/pokemon.entity';
import { isValidObjectId, Model } from 'mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {

  private defaultLimit: number;
  constructor(
    @InjectModel(Pokemon.name) 
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService: ConfigService
  ){
    // Se puede mejorar asi, le decimos a TypeScript que esto debe ser un numero
    this.defaultLimit = configService.getOrThrow<number>('defaultLimit');
    // console.log({this.defaultLimit});
  }

  async create(createPokemonDto: CreatePokemonDto): Promise<Pokemon> {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();
    try {
      const newPokemon = await this.pokemonModel.create(createPokemonDto);
      return newPokemon;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = this.defaultLimit, offset = 0} = paginationDto;
    return this.pokemonModel.find()
      .limit( limit)
      .skip(offset)
      .sort({
        no: 1
      })
      .select('-__v');
  }

  async findOne(term: string): Promise<PokemonDocument> {
    
    let pokemon: PokemonDocument;
    // Valido si el valor es un numerico
    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({no: term});
    }
    // Valido si es mongo id
    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }
    // Name
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({name: term.toLowerCase().trim()});
    }
    // Valido si existe el registro
    if (!pokemon) {
      throw new NotFoundException(`Pokemon with id, name or no "${term} not found"`);
    }
    
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto): Promise<PokemonDocument> {
    const pokemon = await this.findOne(term);
    if (updatePokemonDto.name) updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    Object.assign(pokemon, updatePokemonDto);
    try {
      await pokemon.save();
      return pokemon;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    // const pokemon = await this.findOne(id);
    // await pokemon.deleteOne();
    // const result = await this.pokemonModel.findByIdAndDelete(id);
    const { deletedCount } = await this.pokemonModel.deleteOne({_id: id});
    if (deletedCount === 0) throw new BadRequestException(`Pokemon with id "${id}" not found`);
    return;
  }

  private handleExceptions (error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(`Pokemon existis in DB ${JSON.stringify(error.keyValue)}`)
    }
    throw new InternalServerErrorException(`Cant update pokemon - Check server logs`);
  }
}
