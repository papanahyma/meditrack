import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import mkcert from 'vite-plugin-mkcert' // delete this line

export default defineConfig({
  plugins: [react()], // remove mkcert()
  // server: {
  //   https: true  // delete this whole block
  // }
})