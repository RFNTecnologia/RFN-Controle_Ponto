import { build } from 'vite';

// BASE_PATH permite gerar o build para a raiz do dominio ("/")
// ou para um subpath (ex.: "/ponto/"). Em Docker o padrao e a raiz.
process.env.BASE_PATH = process.env.BASE_PATH || '/';
await build();
