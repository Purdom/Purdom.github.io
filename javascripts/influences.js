[
  {
    name: "China_Miéville",
    size: 3000,
      imports: [J._G._Ballard, Michael_Moorcock]
},

  {
    name: "J._G._Ballard",
    size: 3000,
      imports: [Marshall_McLuhan, William_S._Burroughs]
},

{
  name: "Michael_Moorcock",
  size: 3000,
  imports: [J._G._Ballard, William_S._Burroughs]
},

{
  :if expand("%") == ""|browse confirm w|else|confirm w|endif
    William_S._Burroughs,
  size: 3000,
  imports: [Jean-Paul_Satre]
},

{
  J._G._Ballard,
  size: 3000,
  imports: [William_S._Burroughs]
},

{
  Jean-Paul_Satre,
  size: 3000,
  imports: [Simone_de_Beauvoir]
},

{
  Simone_de_Beauvoir,
  size: 3000,
  imports: [Jean-Paul_Satre]
},

