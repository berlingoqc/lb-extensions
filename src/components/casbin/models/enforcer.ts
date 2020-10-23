import * as casbin from 'casbin';
import {Filter} from '@loopback/repository';

// Format de l'object qui est utilisé pour ABAC
export interface Attribute {
  Name: string;
  Owner: string;
  [id: string]: string;
}

// Signature d'une fonction qui retourne un Enforcer par role ou filtre custom
export type EnforcerByRoleOrFilter = (
  name?: string,
  userId?: string,
  filter?: Filter,
) => Promise<casbin.Enforcer | undefined>;
