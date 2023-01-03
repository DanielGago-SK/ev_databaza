const modal_content = document.querySelector("#modal_content");
// základná stránka sa pomocou opacity potom pri aktívnom modal okne utlmuje!
const basic_page = document.querySelector(".width");
const section_result = document.querySelector(".result");
const loading_spinner = document.querySelector("#loading_spinner_block");
// pgn span - to sú všetky tlačidlá pre výber počtu modelov na stránku
const pgn_setting = document.querySelectorAll(".pgn span");
pagination_number = 12; // koľko kusov elementov chcem maximálne na stánku nastavím tu
/* 12 je ideál - deliteľné 2, 3, 4, 6 - mriežka je tak skoro vždy plná */

// tento sled príkazov by si mal otestovať na akom zariadení sa pracuje. S mobilom / PC to funguje, zobrazuje mi korektné počty na stránku. S tabletom som to netestoval, pre Android tablet to nedetekovalo ako tablet.
if (/ipad|tablet/i.test(navigator.userAgent)) {
  // nastaví nový počet modelov na stránku
  pagination_number = 9;
  //console.log("it's a Ipad");
} else if (/mobile/i.test(navigator.userAgent)) {
  // na mobile je 12 obrázkov veľa, stačí 6...
  pagination_number = 6;
  //console.log("it's a Mobile");
} /*else {
  //console.log("it's a Desktop";//zostáva teda plný počet 12...
//*/
// a ešte označ ako vybraný potrebný blok pre výber počtu položiek na stránku
document
  .querySelector(`[data-pgn = "${pagination_number}"]`)
  .classList.add("sel");

/* použité farby (niektoré sú mierne upravené tie štandardné) */
const orange = "#ff7900"; /*"#ff881d"*/
const green = "#009f00";
const red = "#ff0000";

/*** efekt s nadpisom ***/
// nasjkôr si ho vytiahnem z obsahu, ak ho budem chcieť meniť tak stačí normálne v html...
h1_txt = document.querySelector("#h1_txt");
// a jeho vnútorný text
h1_string = h1_txt.innerText;
// vymaž ho, nahradím to span elementami. Je to tak rýchle že to ani nie je vidno...
h1_txt.innerHTML = "";

// transformácia jednotlivých písmen na span elementy
for (let index = 0; index < h1_string.length; index++) {
  sp = document.createElement("span");
  sp.innerText = h1_string.charAt(index);
  h1_txt.appendChild(sp);
}
// stále nič nevidno, text má stále farbu pozadia, ale miesto pre text mám stále rezervované...

// a idem postupne meniť farbu span písmen - efekt akoby postupného písania textu
const spans = document.querySelectorAll("#h1_txt span");
let i = 0;
setTimeout(typeWriter, 500);
// funkcia s postupným časovaním mení farby jednotlivých písmen - sama sa opätovne volá kým nie je napísaný komplet text
function typeWriter() {
  if (i < spans.length) {
    spans[i].style.color = "black";
    i++;
    setTimeout(typeWriter, 30);
  }
}

/* nahraj databázu - nateraz z vlastného lokálneho servera... jeden .json súbor */
// nič menej, ako mi bolo pripomenuté - príliž rozsiahle takéto databázy (veľký .json súbor) prehliadač nezvládne... musí to mať na starosti back-end potom...
getData("ev_db.json");

async function getData(file) {
  let myObject = await fetch(file);
  let myText = await myObject.text();
  database = JSON.parse(myText);

  // napíš hneď na stránku koľko modelov databáza obsahuje a ako je aktuálna
  // dátum poslednej aktualizácie - je uložený samostatne - ako prvý element databázy!
  // po tom čo sa spracuje sa zmaže...
  last_update.innerText = database[0].version;
  database.shift();
  vehicle_count.innerText = database.length;

  // nasledujúce riadky usporiadajú EV podľa abecedy => podľa značky/výrobcu...
  function compare(a, b) {
    if (a.brand > b.brand) return 1;
    if (a.brand < b.brand) return -1;
    return 0;
  }
  database.sort(compare);

  // databáza je načítaná, volaj ďalšie funkcie

  // zavolá funkciu čo prebehne všetky značky a nastaví správne "filter značiek"
  createVehiclesBrandSelect();
  // aktivuje sa funkcia na výber značiek
  selectBrand();
  // aktivuj funkciu na výber filtrov pre obsah na zobrazenie, ešte pred tým si ich raz načítam, aby sa to vykonalo iba raz...
  input_filter = document.querySelectorAll(`.check_box input[type="checkbox"]`);
  controlFilterCheckbox();
  // keď chcem všetky vozidlá, tak treba nastaviť pole objektov pre zobrazenie všetkých vozidiel z databázy
  // neskôr budem pracovať s inými - filtrovanými poliami
  selected_brand = database; // výber podľa značky - pri štarte všetky objekty
  selected_filter = database; // výber podľa filtrov - pri štarte všetky objekty
  // zavolaj funkciu čo vykreslí zoznam na obrazovku
  // createVehicleArticles() - netreba to volať samostatne, volá si to potom nastavenie paginácie samo. tú funkciu volám aj vždy po tom ako sa zmenia niektoré filtre...
  // todo ako sa predĺži načítavanie databazy v budúcnosti tak tu bude ten čas automaticky pár sekúnd, teraz pre efekt 2 sekundy...
  setTimeout(() => {
    loading_spinner.style.display = "none";
    // a až teraz, keď nabehol korektne celý obsah, aktivuj aj funkciu na nastavovanie počtu vozidiel na stránku, lebo v nej sa volá taktiež funkcia createVehicleArticles a teda databáza musí byť načítaná...
    pgnSetting();
    // nasledujúce riadky kódu nulujú filtre pri každom reloade stránky... ak to nebolo, tak zostávali "checkbox" občas atívne označené ale v podstate nespracované...
    // po reloade aj tak žiadny filter nechcem...
    const input_filter = document.querySelectorAll(
      `.check_box input[type="checkbox"]`
    );
    input_filter.forEach((input) => (input.checked = false));
    input_filter[0].checked = true;
    input_filter[0].parentElement.style.fontWeight = "bold";
    displayFiltersStatus();
    const input_brand = document.querySelectorAll(
      `.check_box_mark input[type="checkbox"]`
    );
    input_brand.forEach((input) => (input.checked = false));
    input_brand[0].checked = true;
    input_brand[0].parentElement.style.fontWeight = "bold";
    displayBrandsStatus();
    // pre všetky input elementy nastavím automaticky "bold" písmo ak sú "checked", pomocou CCS to nejde, sú to predchádzajúce elementy...
    const inputs = document.querySelectorAll("input");
    inputs.forEach((imp) => {
      // samozrejme po každej zmene stavu to treba prepisovať... takže tu dám na to potrebný eventListener
      imp.addEventListener("change", () => {
        inputs.forEach((element) => {
          element.checked
            ? (element.parentElement.style.fontWeight = "bold")
            : (element.parentElement.style.fontWeight = "normal");
        });
      });
    });
  }, 2000);
}

/* spracovanie tlačidiel pre nastavenie paginácie */
function pgnSetting() {
  pgn_setting.forEach((element) => {
    element.addEventListener("click", function () {
      pgn_setting.forEach((pgn) => pgn.classList.remove("sel"));
      this.classList.add("sel");
      pagination_number = Number(this.dataset.pgn);
      createVehicleArticles();
    });
  });
}

/* spracuje všetky značky a zaradí ich do selectoru značiek */
function createVehiclesBrandSelect() {
  //const v_selector = document.getElementById("vehicle_mark");
  const brand_select = document.getElementById("brand_select");
  /* vytvorím pole výrobcov / značiek áut ktoré sa nachádzajú v databázy*/
  v_brand = [];
  database.forEach((element) => v_brand.push(element.brand));
  /* odfiltruj rovnaké značky, aby sa nezobrazovali násobne... */
  v_brand_unique = [...new Set(v_brand)];
  /* a uprac ich podľa abecedy... */
  v_brand_unique.sort();
  // najskôr vytvoríme prvý výber - vypnutie filtra značiek...
  brand_select.innerHTML += `<label class="check_box_mark">Vypnutý filter značiek<input type="checkbox" id="no_mark"><span class="checkmark"></span></label><br>`;
  /* a filtrovaný zoznam potom prihoď do základu selektora... */
  v_brand_unique.forEach((brand) => {
    brand_select.innerHTML += `<label class="check_box_mark">${brand}<input type="checkbox" id="${brand}"><span class="checkmark"></span></label>`;
  });
  // a hneď to načítaj, neskôr s nimi pracujem...
  input_brand = document.querySelectorAll(
    `.check_box_mark input[type="checkbox"]`
  );
}

// zobraz všetky, alebo vybrané autá z katalógu
/* aby toto bolo univerzálne, aj pre  filtrované zoznamy, tak to teda je vždy s osobitnou sadou áut, ale prvý krát (a pri vypnutých filtroch) bude vlastne identická s originálom */

function createVehicleArticles() {
  section_result.innerHTML = ""; // premaž obsah
  selected_items = []; // nuluj výber vozidiel
  // do výberu na zobrazenie sa dostanú iba modely ktoré prešli oboma filtrami...
  // táto funkcia urobí prienik
  selected_items = selected_brand.filter((element) =>
    selected_filter.includes(element)
  );

  // kontrola dĺžky celého zoznamu artiklov
  s_itm_lenght = selected_items.length;
  // zisťujem potrebný počet stránok zoznamu (pagination)
  // najskôr zistím koľkokrát mám danú hodnotu - počet celých stránok
  // premenná pagination_number má nastavený maximálny počet artiklov na stránku
  s_itm_sites = Math.floor(s_itm_lenght / pagination_number);
  // ak bol aj dajaký zbytok po tom delení tak vlastne mám ďalšiu stránku... tak ju pridaj
  // toto vlastne vytvorí korektne aj číslo 1 ak je artiklov menej ako na komplet stránku, čiže viem že mám jednu stránku, aj keď nekompletnú...
  s_itm_lenght % pagination_number !== 0 ? s_itm_sites++ : undefined;
  // premenná teraz obsahuje počet stránok ktoré potrebujem zobraziť na pagináciu...
  // zavolaj funkciu na zobrazenie paginačných tlačidiel
  // volám ju za každých okolností, ak nie je čo zobraziť tak ona si to sleduje a práve aj premazáva starý, už nepotrebný obsah v pagination bloku ak tam bol! Musím ju teda vždy volať.
  displayPaginationBtns(s_itm_sites);
  // zobraz prvú stranu zoznamu (0), ostatné si zavolá potom funkcia na kontrolu paginácie
  // funkcia si sama ošetruje čo má zobraziť na tej prvej stránke
  displayVehicles(0);
}

/***  funkcia na zobrazenie paginačných tlačidiel dolu pod zoznamom ***/
function displayPaginationBtns(sites) {
  if (sites == 1 || sites == 0) {
    // nie je čo zobraziť... je jedna,či žiadna stránka, vymaž pagináciu
    pagination.style.display = "none";
    // a index stránkovania na prvú stránku! Ak by tam dajaký iný zostal robilo by to neplechu...
    pgn_index = 0;
    // a návrat, ďalšia činnosť nie je potrebná
    return;
  }

  // zobrazím pgn tlačidlá
  // << 1 ... 5 6 7 .... 10 >>
  pgn_index = 0; // nastav index stránkovania na prvú stránku, pri štarte je aktívna prvá strana...(nula)
  displayPaginationStatus(sites, pgn_index);
}

// zobrazenie statusu paginácie, tu sa aktivuje aj kontrola klikania
function displayPaginationStatus(sites, active_site) {
  if (sites < 6) {
    // len "základné" zobrazenie
    // na úvod šípka vľavo
    pgn_html = `<li data-pgn_btn = "-" class = "number">&laquo;</li>`;
    // potom v cykle potrebné čisla stránok
    // tu je klasický for cyklus treba - potrebujem ten index a parameter cyklu je tu číslo! takže tu nemám žiadnu dĺžku poľa...
    for (let index = 0; index < sites; index++) {
      pgn_html += `<li data-pgn_btn = "${index}" class = "number">${
        index + 1
      }</li>`;
    }
    // na záver ešte šípka vpravo
    pgn_html += `<li data-pgn_btn = "+" class = "number">&raquo;</li>`;
  } else {
    // pokročilé zobrazenie, aj s bodkami
    // ak je aktívne 1., 2. alebo 3. strana od konca, alebo od začiatku, tak sa nezobrazia na danej strane bodky... (ak je index menej ako 2 alebo viac ako počet strán -3)
    pgn_dots = "&centerdot;&centerdot;"; // nastav koľko bodiek sa bude zobrazovať
    pgn_html = `<li data-pgn_btn = "-" class = "number">&laquo;</li>`;
    // prvú stranu zobraz určite...
    pgn_html += `<li data-pgn_btn = "0" class = "number">1</li>`;
    // nasledujú jenodtlivé popdmienky pre kraje
    if (active_site == 0) {
      pgn_html += `<li data-pgn_btn = "1" class = "number">2</li>`;
    }
    if (active_site == 1) {
      pgn_html += `<li data-pgn_btn = "1" class = "number">2</li>
      <li data-pgn_btn = "2" class = "number">3</li>`;
    }
    if (active_site == 2) {
      pgn_html += `<li data-pgn_btn = "1" class = "number">2</li>
      <li data-pgn_btn = "2" class = "number">3</li>
      <li data-pgn_btn = "3" class = "number">4</li>`;
    }
    // ak treba zobraz bodky za "1"
    if (active_site > 2) {
      pgn_html += `<li style = "font-weight: 600;">${pgn_dots}</li>`;
    }
    if (active_site == sites - 3) {
      pgn_html += `
      <li data-pgn_btn = "${sites - 4}" class = "number">${sites - 3}</li>
      <li data-pgn_btn = "${sites - 3}" class = "number">${sites - 2}</li>
      <li data-pgn_btn = "${sites - 2}" class = "number">${sites - 1}</li>`;
    }
    if (active_site == sites - 2) {
      pgn_html += `
      <li data-pgn_btn = "${sites - 3}" class = "number">${sites - 2}</li>
      <li data-pgn_btn = "${sites - 2}" class = "number">${sites - 1}</li>`;
    }
    if (active_site == sites - 1) {
      pgn_html += `
      <li data-pgn_btn = "${sites - 2}" class = "number">${sites - 1}</li>`;
    }
    if ((active_site > 2) & (active_site < sites - 3)) {
      // a tu je vyriešený stred - ak žiadny kraj doteraz nebol...
      pgn_html += `
  <li data-pgn_btn = "${active_site - 1}" class = "number">${active_site}</li>
  <li data-pgn_btn = "${active_site}" class = "number">${active_site + 1}</li>
  <li data-pgn_btn = "${active_site + 1}" class = "number">${
        active_site + 2
      }</li>`;
    }
    // ak treba zobraz bodky pred poslednpu číslicou
    if (active_site < sites - 3) {
      pgn_html += `<li style = "font-weight: 600;">${pgn_dots}</li>`;
    }
    // poslednú stranu treba tiež...
    pgn_html += `<li data-pgn_btn = "${
      sites - 1
    }" class = "number">${sites}</li>`;
    pgn_html += `<li data-pgn_btn = "+" class = "number">&raquo;</li>`;
  }
  // zobraz to celé na stránku - do <ul> elementu
  pagination.innerHTML = pgn_html;
  pagination.style.display = "flex";
  // označ aktívnu stránku ako selected
  pgn_li = document.querySelectorAll("#pagination .number");
  // zistím ju len tak že všetky prebehnem a kontrolujem ich data atribút s aktívnou stránkou a tú potom označím. zároveň pre ostatné class selected deaktivujem
  pgn_li.forEach((pgn) => {
    pgn.dataset.pgn_btn == active_site
      ? pgn.classList.add("selected")
      : pgn.classList.remove("selected");
    // a keď ten zoznam už cyklím, tak tomu dám aj kontrolu kliknutia...
    pgn.addEventListener("click", paginationClick);
  });
}

// kontrola klikania už je nastavená...
function paginationClick() {
  let sites = s_itm_sites;
  // kontrola "+" - pozor na koniec stránkovania
  if (this.dataset.pgn_btn == "+") {
    if (pgn_index < sites - 1) {
      pgn_index += 1;
    } else return;
    // kontrola "-" - pozor na začiatok
  } else if (this.dataset.pgn_btn == "-") {
    if (pgn_index > 0) {
      pgn_index -= 1;
    } else return;
  } else {
    // takže bolo kliknuté na dajaké číslo... Ak nie je také isté ako predchádzajúce tak vykonaj zmenu
    if (pgn_index == Number(this.dataset.pgn_btn)) {
      return;
    } else {
      pgn_index = Number(this.dataset.pgn_btn);
    }
  }
  displayPaginationStatus(s_itm_sites, pgn_index);
  // mám index stránky, stačí zavolať funkciu na vykreslenie zoznamu s argumentom indexu
  displayVehicles(pgn_index);
  // a potom ešte naskrolujem na začiatok zoznamu áut
  // treba tam časovač, dajako sa to sekalo bez neho, asi nie je korektne dačo načítané tak okamžite... stáva sa to...
  setTimeout(() => {
    window.scrollTo({
      top: document.getElementById(filter_info.id).offsetTop + 10,
      left: 0,
      behavior: "smooth",
    });
  }, 30);
}

// tu sa  zobrazí potrebná stránka s vozidlami, pri štarte 0-ltá, neskôr podľa potreby, ako parameter dostávam číslo stránky ktorú treba aktuálne zobraziť
function displayVehicles(page_number) {
  section_result.innerHTML = ""; // premaž obsah
  // kontrola prázdneho zoznamu a oznámenie o tom na obrazovke
  if (selected_items.length == 0) {
    section_result.classList.add("grid_off");
    section_result.innerHTML = `<span style="font-weight: 700;">Pre túto kombináciu filtrov nevyhovuje žiadne vozidlo...</span>`;
    // a návrat, netreba ďalej nič zobrazovať...
    return;
  }
  // .grid_off ruší mriežku, aby bol text v strede obrazovky, takže ak je zoznam ,tak zrušiť .grid_off
  section_result.classList.remove("grid_off");

  // štart a koniec indexov pre zoznam ráta aj s aktuálnou stránkou!
  // na ďalších stranách sú prvky s násobkami indexov
  i_start = page_number * pagination_number; //0,1,2...
  i_end = i_start + pagination_number; //0 + 12...
  // ešte musím skontrolovať či aktuálny počet prvkov na zobrazenie nie je menší ako maximálne povolený počet prvkov na stránku... a upraviť teda počet
  i_end > selected_items.length ? (i_end = selected_items.length) : undefined;
  // a už len zobraziť potrebný počet artiklov na stránku
  // aj tu je klasický for cyklus OK, aj tak pracujem aj s tým indexom...
  for (let index = i_start; index < i_end; index++) {
    let item = selected_items[index];
    !item.production
      ? (production = `<p class="production_info" style="color:${red};">Vozidlo sa už nevyrába!</p>`)
      : (production = `<p class="production_info" style="color:${green};">Vozidlo sa aktuálne vyrába.</p>`);
    el = document.createElement("article");
    el.setAttribute("data-number", index);
    el.classList.add("item");
    htmldata = `
  <div><h3 class="model_info">${item.model}</h3>
                <img src="${item.img_source}" data-model_id="${index}" alt="obrázok - EV"></div>
                        <p>${item.description}</p>
                        <div>${production}
                        <p class = "details_button" data-model_id="${index}">Klikni pre viac informácií</p></div>`;
    el.innerHTML = htmldata;
    section_result.appendChild(el);
  }
  // všetky tlačidlá "Klikni pre viac informácií" sa aktivujú
  // a spolu s nimi aj obrázky, je to také intuitívne môcť kliknúť aj na obrázok
  buttons = document.querySelectorAll(".details_button, .item img");
  buttons.forEach((btn) => {
    btn.onclick = function () {
      /* zavolá funkciu na vytvorenie obsahu modal okna, s indexom vozidla */
      make_modal(Number(this.dataset.model_id));

      //! 2 riadky blokácie posunu
      document.body.style.top = `-${window.pageYOffset}px`;
      document.body.style.position = "fixed";
      /* toto som dal generálne do css ka... fix posunu obsahu stránky do strán počas vyvolaného modal okna a blokácie skrolovania pomocou príkazov vyššie
      document.body.style.left = "0";
      document.body.style.right = "0";*/

      setTimeout(() => {
        // zvidieteľny modal okno
        modal_x.style.display = "";
        modal.style.display = "block";
        // aj naskroluj hore (ak bolo predtým otvorené modal okno, a posunulo sa, tak aj nové sa otvorilo posunuto...)
        modal_content.scrollTo({ top: 0 }); // tu netreba behavior smooth, lepšie keď je obsah okamžite hore...
        // pomalý nábeh škálovaním veľkosti od 0 po 1 (transition v CSS)
        modal_content.style.transform = "scale(1)";
        // a ešte utlmenie okolitého hlavného obsahu stránky
        basic_page.style.opacity = "0.15";
        modal.style.backgroundColor = "rgba(0, 0, 0, 0.20)";
      }, 20);
    };
  });
}

// zobraz vyskakovacie modal okno s konkrétnym vozidlom, jeho index je parameter
function make_modal(item_id) {
  // najskôr sa upraví obsah pre bloky podľa toho čo za hodnoty sa načítalo z databázy
  // len málo z nich sa dá zobraziť priamo...
  /*
   * samozrejme do vlastnej databáze som si mohol písať údaje ako mi vyhovuje, ako chcem, ale ide o to vedieť robiť s tým čo prichádza, no a to nebude asi nikdy podľa mojich predstáv... preto to aj tu spracovávam takto prácne */
  // do premennej item dám konkrétny objekt s ktorým tu pracujem, mám tak menej zápisu v nasledujúcom kóde pri spracovávaní vlastností objektu...
  let item = selected_items[item_id];
  if (!item.production) {
    production = `<p class="production_info" style="color:${red};">Vozidlo sa už nevyrába!</p>`;
  } else {
    production = `<p class="production_info" style="color:${green};">Vozidlo sa aktuálne vyrába.</p>`;
  }

  if (!item.ac_charging.value_min) {
    ac_charging = `<span style = "color: ${red};">Vozidlo nemá AC nabíjanie!</span>`;
  } else if (!item.ac_charging.value_max) {
    ac_charging = `${item.ac_charging.value_min} kW`;
  } else {
    ac_charging = `${item.ac_charging.value_min} až ${item.ac_charging.value_max} kW`;
  }
  if (item.ac_charging.phases_min) {
    if (!item.ac_charging.phases_max) {
      ac_charging += `<br>(počet fáz: ${item.ac_charging.phases_min})`;
    } else {
      ac_charging += `<br>(počet fáz: ${item.ac_charging.phases_min} až ${item.ac_charging.phases_max})`;
    }
  }

  if (!item.dc_charging.value_min) {
    dc_charging = `<span style = "color: ${red};">Vozidlo nemá DC nabíjanie!</span>`;
  } else if (!item.dc_charging.value_max) {
    dc_charging = `${item.dc_charging.value_min} kW`;
  } else {
    dc_charging = `${item.dc_charging.value_min} až ${item.dc_charging.value_max} kW`;
  }

  if (!item.battery_capacity.nominal_max) {
    bc_nominal = `${item.battery_capacity.nominal_min} kWh`;
    bc_use = `${item.battery_capacity.useable_min} kWh`;
  } else {
    bc_nominal = `${item.battery_capacity.nominal_min} až ${item.battery_capacity.nominal_max} kWh`;
    bc_use = `${item.battery_capacity.useable_min} až ${item.battery_capacity.useable_max} kWh`;
  }

  if (!item.range.WLTP_max) {
    wltp_range = `${item.range.WLTP_min}`;
  } else {
    wltp_range = `${item.range.WLTP_min} až ${item.range.WLTP_max}`;
  }

  min_max_range = `${item.range.min} do ${item.range.max}`;

  seats = "";
  /* počet sedadiel menej ako 5 bude zvýraznený */
  if (item.vehicle_seats < 5) {
    seats = `<span style = "color: ${red};">${item.vehicle_seats} !</span>`;
  }
  /* viac ako 5 tiež */
  if (item.vehicle_seats > 5) {
    seats = `<span style = "color: ${green};">${item.vehicle_seats} !</span>`;
  }
  /* 5 je štandard, bežné zobrazenie */
  if (item.vehicle_seats == 5) {
    seats = `<span> 5</span>`;
  }

  if (!item.engine_power_max) {
    engine_power = `${item.engine_power_min}`;
  } else {
    engine_power = `${item.engine_power_min} až ${item.engine_power_max}`;
  }

  if (item.AWD) {
    awd = `áno`;
  } else {
    awd = "nie";
  }

  if (!item.akceleration_max) {
    akceleration = `${item.akceleration_min}`;
  } else {
    akceleration = `${item.akceleration_min} až ${item.akceleration_max}`;
  }

  if (item.bat_cooling_active) {
    cooling = `áno`;
  } else {
    cooling = "nie";
  }
  /* "?" takto zapísaný stav platí ako neznámy stav */
  if (item.bat_cooling_active == "?") {
    cooling = `neznámy stav`;
  }

  if (item.heat_pump) {
    heat_pump = `áno`;
    if (item.h_p_info !== null) heat_pump += ` (${item.h_p_info})`;
  } else {
    heat_pump = "nie";
  }
  /* "?" takto zapísaný stav platí ako neznámy stav */
  if (item.heat_pump == "?") {
    heat_pump = `neznámy stav`;
  }

  roof_rack = "";
  if (item.roof_rack == false) {
    roof_rack = `nie`;
  }
  if (item.roof_rack == true) {
    roof_rack = `áno`;
  }
  /* "?" takto zapísaný stav platí ako neznámy stav */
  if (item.roof_rack == "?") {
    roof_rack = `neznámy stav`;
  }

  if (item.towing_device == true) {
    t_d = `áno `;
    /* aj reštrikcie majú znamienka, ale iba "*" pre oranžové obmedzenie... */
    if (item.t_d_restriction !== "") {
      if (item.t_d_restriction.startsWith("*")) {
        t_d += `<span style = "color: ${orange};">- ${item.t_d_restriction.substring(
          1
        )}</span>`;
      } else {
        t_d += `<span>- ${item.t_d_restriction}</span>`;
      }
    }
  } else if (item.towing_device == "?") {
    t_d = `neznámy stav`;
  } else {
    t_d = `nie`;
  }

  more_info = "";
  /* ak je prvý znak '!' - text bude červený ako výstražné info, ak je znak '*' - text bude oranžový, ako obmedzenie a pod., ak '+', tak bude text zelený, ako plusová vlastnosť, výhoda, ak nie je žiadny znak, text bude normálne základný */
  if (item.plus_info.length !== 0) {
    more_info += `<p><b>Ďalšie zaujímavé informácie:</b></p>`;
    for (let index = 0; index < item.plus_info.length; index++) {
      info_text = item.plus_info[index];
      c = "var(--color_txt)";
      if (info_text.startsWith("!")) {
        info_text = info_text.substring(1);
        c = red;
      }
      if (info_text.startsWith("*")) {
        info_text = info_text.substring(1);
        c = orange;
      }
      if (info_text.startsWith("+")) {
        info_text = info_text.substring(1);
        c = green;
      }
      more_info += `<p style="color: ${c};">- ${info_text}</p>`;
    }
  }

  reviews = "";
  if (item.reviews.length !== 0) {
    reviews += `<p><b>Odkazy na recenzie, články:</b></p>`;
    for (let index = 0; index < item.reviews.length; index++) {
      reviews += `<a href="${item.reviews[index].link}" target="_blank" rel="noopener noreferrer">${item.reviews[index].text}</a><br>`;
    }
  }

  /* a teraz môžem vytvoriť obsah modal bloku s vlastnosťami vybraného modelu */
  modal_content.innerHTML = `
  <h3 class="model_info">${item.model}</h3>
  <p class="test_db_info">Databáza obsahuje prevažne testovacie údaje!</p>
                <img src="${item.img_source}" alt="obrázok - EV">
                        <p>${item.description}</p>
                        ${production}
        <div class="line" style="border-top:1px solid gray;"></div>
        <p><b>Nabíjanie:</b></p>
        <p><b>AC:</b> ${ac_charging}</p>
        <p><b>DC:</b> ${dc_charging}</p>
        <p><b>Kapacita batérie:</b></p>
        <p>- nominálna: ${bc_nominal}<br>
            - využiteľná: ${bc_use}</p>
        <p><b>Dojazd:</b></p>
        <p> WLTP: ${wltp_range} km<br>
            (Reálny dojazd v praxi, pre všetky verzie a podmienky dohromady, sa pohybuje od ${min_max_range}km!)</p>
        <p><b>Priemerná spotreba:</b> ${item.efficiency}kWh/100km</p>
        <p><b>Počet miest:</b> ${seats}</p>
        <p><b>Výkon motora:</b> ${engine_power}kW</p>
        <p><b>Pohon všetkých kolies:</b> ${awd}</p>
        <p><b>Zrýchlenie 0-100 km/h:</b> ${akceleration} s</p>
        <p><b>Hmotnosť (prázdneho) vozidla:</b> ${item.weight} kg</p>
        <p><b>Aktívny termomanažment batérie:</b> ${cooling}</p>
        <p><b>Tepelné čerpadlo:</b> ${heat_pump}</p>
        <p><b>Strešný nosič:</b> ${roof_rack}</p>
        <p><b>Ťažné zariadenie:</b> ${t_d}</p>
        ${more_info}
        ${reviews}
        <div class="arrows"><span onclick="modal_content.scrollTo({
  top: 0,
  left: 0,
  behavior: 'smooth'
})">▲</span>&nbsp;<span onclick="modal_content.scrollTo({
  top: modal_content.scrollHeight,
  left: 0,
  behavior: 'smooth'
})">▼</span>&nbsp;</div>
        `;

  // ! toto potom prípadne vymazať, ale je to výborná kontrola či mám správne zapísané veci v databáze... Každý nový artikel si skúšobne zobrazím a hneď dostanem výsledok kontroly...
  if (modal_content.innerHTML.includes("undefined")) {
    alert(
      "Bordel v poliach databázy... Oprav obsah pre položku zobrazenú v modal okne."
    );
  }
}

/* možné varianty šípok... */
/* <div class="arrow">&#8593; &#8595;&nbsp;</div>; */
/* <div class="arrow">▲ ▼&nbsp;</div> */

/* control click on "X" button or out of modal to exit modal window */
window.onclick = function (e) {
  /*if (e.target.id =="modal" || e.target.id == "modal_x" || e.target.id == "modal_x_span")  */
  if (e.target.getAttribute("data-button") == "x") {
    // táto podmienka stačí, všetky elementy čo môžu zatvoriť modal okno dostali potrebný  data atribút...
    modal_x.style.display = "none";
    modal_content.style.transform = "scale(0)";
    basic_page.style.opacity = "1";

    // ! 4 riadky je odblokovanie posuvu na hlavnej stránke
    scrollY = document.body.style.top;
    // zrušenie pozície fixed
    document.body.style.position = "";
    //document.body.style.top = ""; - netreba...
    window.scrollTo(0, parseInt(scrollY || "0") * -1);
    modal.style.backgroundColor = "rgba(255, 255, 255, 0";
    setTimeout(() => {
      modal.style.display = "none";
    }, 750);
  }
};

/*** načítaj a spracuj selector značiek ***/
function selectBrand() {
  // pracujem tu s "input_brand" - tu sa načítali všetky inputy pre značky, pri ich spracovaní z databázy

  for (let b of input_brand) {
    b.addEventListener("click", function () {
      selected_brand =
        []; /* vynuluj, naložím tam iba modely áut aktuálne vybranej značky */
      // vybral som voľbu bez filtrov!
      if (b.id == "no_mark") {
        // všetky ostatné možnosti deaktivuj
        input_brand.forEach((input) => (input.checked = false));
        // a len táto je teda aktívna, je jedno či sme ju aktivovoali, alebo deaktivovali, ona ako hlavná deaktivovať nejde... ona v podstate preráža všetky ostatné...
        // takže ju pre istotu označím ako "checked"
        this.checked = true;
        // a zobrazím stav
        displayBrandsStatus();
        return;
      }
      // inak - prvú deaktivuj, bude aktívna dajaká iná, preveríme...
      input_brand[0].checked = false;
      if (this.checked) {
        //ak je tá stlačená teraz aktívna, tak OK, spracujem - zmena zobrazenia
        displayBrandsStatus();
        return;
      }
      // ak ale sa deaktivovala, tak kontrola či je vôbec teraz dajaká aktívna...
      // kontrola či náhodou nemám "nič vybrané", potom aktivujem prvú voľbu, bez filtra...
      for (let input of input_brand) {
        if (input.checked == true) {
          // ak čo i len jedna voľba bude aktívna, tak koniec cyklu a môžem zobrazovať
          displayBrandsStatus();
          return;
        }
      }
      // nič nebolo aktívne - zostala teda len jediná možnosť - aktivovať "žiadny filter"
      input_brand[0].checked = true;
      displayBrandsStatus();
    });
  }
}

function displayBrandsStatus() {
  if (input_brand[0].checked) {
    // zobraz všetky značky
    selected_brand = database;
    filtered_brand.style.color = "black";
    brand = "zobrazujem všetky značky  ";
  } else {
    brand = "";
    filtered_brand.style.color = "red";
    input_brand.forEach((element) => {
      if (element.checked) {
        vehicles = 0;
        for (const vehicle of database) {
          if (vehicle.brand == element.id) {
            selected_brand.push(vehicle);
            vehicles++;
          }
        }
        brand += element.id + "&nbsp;(" + vehicles + "); ";
      }
    });
  }
  filtered_brand.innerHTML = brand.slice(0, -2);
  /* a zavolaj funkciu na prekreslenie zoznamu áut na stránke */
  createVehicleArticles();
}

/*** načítaj a spracuj checkbox filtrovania */
function controlFilterCheckbox() {
  // pracujem tu s "input_filter" - v ňom sú načítané všetky výbery pre filtre

  for (let i of input_filter) {
    i.addEventListener("click", function () {
      // nulovanie poľa objektov, spravím nové...
      selected_filter = [];
      // vybral som voľbu bez filtrov!
      if (this.id == "filter_off") {
        // všetky ostatné možnosti deaktivuj
        input_filter.forEach((input) => (input.checked = false));
        // a len táto je teda aktívna, je jedno či sme ju aktivovoali, alebo deaktivovali, ona ako hlavná deaktivovať nejde... ona v podstate preráža všetky ostatné...
        // takže ju pre istotu označím ako "checked"
        this.checked = true;
        // a zobrazím stav
        displayFiltersStatus();
        return;
      }
      // inak - prvú deaktivuj, bude aktívna dajaká iná, preveríme...
      input_filter[0].checked = false;
      if (this.checked) {
        //ak je tá stlačená teraz aktívna, tak OK, spracujem - zmena zobrazenia
        // POZOR na vzájomnú deaktiváciu vyrábané / nevyrábané vozidlá!
        if (this.id == "production_true") {
          document.getElementById("production_false").checked = false;
        }
        if (this.id == "production_false") {
          document.getElementById("production_true").checked = false;
        }
        displayFiltersStatus();
        return;
      }
      // ak ale sa deaktivovala, tak kontrola či je vôbec teraz dajaká aktívna...
      // kontrola či náhodou nemám "nič vybrané", potom aktivujem prvú voľbu, bez filtra...
      for (let input of input_filter) {
        if (input.checked == true) {
          // ak čo i len jedna voľba bude aktívna, tak koniec cyklu a môžem zobrazovať
          displayFiltersStatus();
          return;
        }
      }
      // nič nebolo aktívne - zostala teda len jediná možnosť - aktivovať "žiadny filter"
      input_filter[0].checked = true;
      displayFiltersStatus();
    });
  }
}

function displayFiltersStatus() {
  // tu sa spracuje výsledný stav filtrov

  // voľba bez filtru sa vybaví hneď a jednoducho, nech sa nezdržujeme...
  if (input_filter[0].checked) {
    filters.style.color = "var(--color_txt)";
    filters.innerHTML = input_filter[0].previousSibling.data;
    selected_filter = database;
    createVehicleArticles();
    return;
  }

  //prebehnem všetky filtre a do výsledného poľa objektov pridám jednotlivé objekty ktoré prejdú filtrami
  /* ! POZOR na to aby sa neopakovali... Ako to vyriešiť? Hneď pri vkladaní, alebo na konci to prečistiť? Nebudú sa opakovať, budem robiť prienik...*/
  filters.innerHTML = "";
  // farba textu je červená ak je vybraný filter
  filters.style.color = `${red}`;
  // výpis filtrov treba pripraviť
  filters_txt = ""; // najskôr z toho urobím reťazec, lebo z poslednej hodnoty odstránim potom čiarku...
  for (let i of input_filter) {
    s_f_input = []; //vždy vynuluj, čo cyklus to naplnenie novými objektami, ktoré prešli konkrétnym filtrom
    if (i.checked) {
      filters_txt += i.previousSibling.data + "; ";
      //vlož do výberu všetky elementy s vlastnosťou i.id
      switch (i.id) {
        /* prefiltruj jednotlivé vlastnosti - ak artikel v databáze obsahuje danú vlastnosť, tak artikel pridaj do výberu */
        case "ac_charging":
          // do s_f_input poľa sa uložia iba položky z databázy ktoré vyhovujú podmienke filtra...
          s_f_input = database.filter(
            (s) =>
              s.ac_charging.value_min >= 11 || s.ac_charging.value_max >= 11
          );
          // s_f_input má teraz všetky artikkle ktoré prešli filtrom
          break;

        case "towing_device":
          s_f_input = database.filter((s) => s.towing_device);
          break;

        case "roof_rack":
          s_f_input = database.filter((s) => s.roof_rack);
          break;

        case "5S_vehicle":
          s_f_input = database.filter((s) => s.vehicle_seats >= 5);
          break;

        case "AWD":
          s_f_input = database.filter((s) => s.AWD);
          break;

        case "active_cooling":
          s_f_input = database.filter((s) => s.bat_cooling_active);
          break;

        case "production_true":
          s_f_input = database.filter((s) => s.production);
          break;

        case "production_false":
          s_f_input = database.filter((s) => !s.production);
          break;

        default:
          // ak by bola dajaká chyba, zobrazí sa všetko bez filtra...
          // ale nerátam s tým... filtre sú napevno naprogramované, takže keď fungujú po prvom teste, budú aj potom... takže úplne to tu neladím...
          s_f_input = database;
          break;
      }
      // ak je výber nateraz prázdny, tak tam len pridaj všetko čo prešlo filtrom...
      // prienik by tu nefungoval, žiadny by nebol...
      if (selected_filter.length == 0) {
        selected_filter = s_f_input;
      } else {
        // ale ak prázdny nebol, tak tam pridaj položky, ale iba "prienik"...
        selected_filter = s_f_input.filter((element) =>
          selected_filter.includes(element)
        );
      }
    }
  }
  // odtsráň bodkočiarku a medzeru z posledného filtru a zobraz použité filtre
  filters.innerHTML = filters_txt.slice(0, -2);
  // selected_filter teraz obsahuje vyfiltrované elementy... zobraz nový stav vozidiel
  createVehicleArticles();
}
