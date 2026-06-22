export interface LeadForm {
  nomeCompleto: string;
  whatsapp: string;
  cidadeUf: string;
  modeloVeiculo: string;
  anoVeiculo: string;
  possuiSeguro: string;
  usaParaTrabalho: string;
  melhorHorario: string;
  observacoes: string;
  aceitaTermos: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}
