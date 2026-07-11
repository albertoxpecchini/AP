-- ============================================================================
-- Sostieni / Donazioni — Query di monitoraggio SPONSOR e MESSAGGI
-- ============================================================================
-- Da eseguire in: Supabase → SQL Editor → New query → Run.
-- Sorgente: tabella public.donatori (vedi supabase/donatori.sql).
--
-- Colonne disponibili in tabella:
--   id · nome · tipo ('donatore'|'sponsor') · importo · messaggio · link · created_at
--
-- NOTA sullo "stato del messaggio": la tabella NON ha una colonna di stato.
-- Qui sotto lo stato viene DERIVATO (es. "con messaggio" / "senza messaggio").
-- Se vuoi uno stato vero e persistente (es. "da contattare/contattato/pubblicato"),
-- usa la sezione 5 in fondo per aggiungere la colonna una volta sola.
-- I timestamp sono convertiti nel fuso Europe/Rome per leggerli comodamente.
-- ----------------------------------------------------------------------------


-- ── 1) MONITORAGGIO SPONSOR (query principale) ──────────────────────────────
-- Elenco sponsor con messaggio, link, importo, data/ora e stato derivato.
-- Ordinati dal più recente (newest-first).
select
  d.id,
  d.nome                                         as sponsor,
  d.link,
  coalesce(d.importo, '—')                       as importo,
  d.messaggio,
  -- Stato DERIVATO (non c'è una colonna di stato nel DB):
  case
    when d.messaggio is not null and length(trim(d.messaggio)) > 0
      then 'messaggio presente'
    else 'nessun messaggio'
  end                                            as stato_messaggio,
  -- Data/ora in fuso orario italiano, formato leggibile
  to_char(d.created_at at time zone 'Europe/Rome',
          'DD/MM/YYYY HH24:MI')                  as inviato_il,
  d.created_at                                   as created_at_utc
from public.donatori d
where d.tipo = 'sponsor'
order by d.created_at desc;


-- ── 2) MESSAGGI DEI DONATORI (firme del libro con testo) ────────────────────
-- Solo i donatori che hanno lasciato due parole nel libro.
select
  d.id,
  d.nome                                         as donatore,
  d.messaggio,
  to_char(d.created_at at time zone 'Europe/Rome',
          'DD/MM/YYYY HH24:MI')                  as firmato_il,
  d.created_at                                   as created_at_utc
from public.donatori d
where d.tipo = 'donatore'
  and d.messaggio is not null
  and length(trim(d.messaggio)) > 0
order by d.created_at desc;


-- ── 3) VISTA UNICA — sponsor + donatori insieme, con tutto ──────────────────
-- Un colpo d'occhio su chi è passato: tipo, messaggio, link, importo, stato, data.
select
  d.id,
  d.tipo,
  d.nome,
  d.link,
  coalesce(d.importo, '—')                       as importo,
  d.messaggio,
  case
    when d.messaggio is not null and length(trim(d.messaggio)) > 0
      then 'con messaggio'
    else 'senza messaggio'
  end                                            as stato_messaggio,
  to_char(d.created_at at time zone 'Europe/Rome',
          'DD/MM/YYYY HH24:MI')                  as quando,
  d.created_at                                   as created_at_utc
from public.donatori d
order by d.created_at desc;


-- ── 4) RIEPILOGO / CONTEGGI ─────────────────────────────────────────────────
-- Numeri sintetici per tipo: totale, quanti con messaggio, primo e ultimo.
select
  d.tipo,
  count(*)                                                       as totale,
  count(*) filter (
    where d.messaggio is not null and length(trim(d.messaggio)) > 0
  )                                                              as con_messaggio,
  count(*) filter (
    where d.link is not null and length(trim(d.link)) > 0
  )                                                              as con_link,
  to_char(min(d.created_at) at time zone 'Europe/Rome',
          'DD/MM/YYYY HH24:MI')                                  as primo,
  to_char(max(d.created_at) at time zone 'Europe/Rome',
          'DD/MM/YYYY HH24:MI')                                  as ultimo
from public.donatori d
group by d.tipo
order by d.tipo;


-- ============================================================================
-- 5) (FACOLTATIVO) STATO PERSISTENTE del messaggio sponsor
-- ============================================================================
-- Se vuoi tracciare a mano lo stato di lavorazione di ogni sponsor (invece del
-- solo stato derivato "con/senza messaggio"), aggiungi una colonna vera.
-- Esegui QUESTO BLOCCO una sola volta; poi aggiornala a mano dalla dashboard.
-- ----------------------------------------------------------------------------
-- alter table public.donatori
--   add column if not exists stato text
--   check (stato in ('da_contattare','contattato','pubblicato','archiviato'))
--   default 'da_contattare';
--
-- -- Esempio: segnare uno sponsor come contattato
-- -- update public.donatori set stato = 'contattato' where id = <ID>;
--
-- -- Poi la sezione 1 può mostrare lo stato REALE così:
-- -- select id, nome as sponsor, link, importo, messaggio,
-- --        coalesce(stato, 'da_contattare') as stato,
-- --        to_char(created_at at time zone 'Europe/Rome','DD/MM/YYYY HH24:MI') as inviato_il
-- -- from public.donatori where tipo = 'sponsor' order by created_at desc;
-- ============================================================================
