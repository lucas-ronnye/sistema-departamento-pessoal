// @ts-nocheck
import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import LoginPage from './LoginPage'
import AuthContext from '../core/AuthContext'

describe('LoginPage', () => {
  it('chama login do AuthContext ao enviar credenciais', async () => {
    const loginMock = jest.fn().mockResolvedValue(undefined)
    const logoutMock = jest.fn()

    render(
      <AuthContext.Provider
        value={{ token: null, user: null, isAuthenticated: false, login: loginMock, logout: logoutMock }}
      >
        <LoginPage />
      </AuthContext.Provider>
    )

    // Digita usuário e senha
    const usuarioInput = screen.getByLabelText('Usuário')
    const senhaInput = screen.getByLabelText('Senha')
    fireEvent.change(usuarioInput, { target: { value: 'admin' } })
    fireEvent.change(senhaInput, { target: { value: '1234' } })

    // Clica em Entrar
    const botaoEntrar = screen.getByRole('button', { name: /Entrar/i })
    fireEvent.click(botaoEntrar)

    // Aguarda chamada ao login
    expect(loginMock).toHaveBeenCalledWith('admin', '1234')
  })
})