import React from 'react';

export default function Ajuda() {
  return (
    <div className="placeholder-page">
      <h2>❓ Ajuda</h2>
      <div className="card">
        <h3>Como usar o PontoFácil</h3>
        <ul className="help-list">
          <li><strong>Indicadores:</strong> visualize resumo do dia e do mês.</li>
          <li><strong>Cartão Ponto:</strong> veja sua folha de ponto mensal detalhada.</li>
          <li><strong>Incluir Ponto:</strong> registre entrada/saída com foto e GPS.</li>
          <li><strong>Justificar Ausência:</strong> envie justificativas para faltas.</li>
          <li><strong>Dados Cadastrais:</strong> atualize suas informações pessoais.</li>
          <li><strong>Alterar Senha:</strong> troque sua senha de acesso.</li>
        </ul>
        <p className="text-muted">Em caso de dúvidas, contate o RH da empresa.</p>
      </div>
    </div>
  );
}
