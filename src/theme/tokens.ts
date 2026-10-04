const light = {
  purple:'#8068EA', purpleSoft:'#EDE8FF', yellow:'#F7C955', yellowSoft:'#FFF5D5',
  ink:'#201D35', muted:'#85829B', line:'#EEEAF4', canvas:'#F8F7FC', card:'#FFFFFF',
  success:'#51A77A', danger:'#DD6B72', dark:'#171522', darkCard:'#242132', darkLine:'#373446',
};
const night:typeof light = { ...light, purple:'#A795FF', purpleSoft:'#332D4D', yellow:'#F7D879', yellowSoft:'#443B2A', ink:'#F4F1FC', muted:'#AAA6B9', line:'#373446', canvas:'#171522', card:'#242132', success:'#72C596', danger:'#F18B92' };
let current:'light'|'dark'='light';
let accent='#8068EA';
export const setPaletteMode=(mode:'light'|'dark')=>{current=mode;};
export const setPaletteAccent=(color:string)=>{if(/^#[\da-f]{6}$/i.test(color))accent=color;};
export const palette=new Proxy(light,{get:(_target,key:string|symbol)=>key==='purple'?accent:key==='purpleSoft'?`${accent}26`:Reflect.get(current==='dark'?night:light,key)});
