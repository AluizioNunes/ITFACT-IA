import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { db } from './db';
import { JwtAuthGuard } from './auth/jwt.guard';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  @Get('servers')
  async getServers() {
    const res = await db.query('SELECT * FROM servers ORDER BY id DESC');
    return res.rows;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('servers')
  async addServer(@Body() body: any) {
    const { hostname, ip, os, location, status } = body;
    const res = await db.query(
      'INSERT INTO servers(hostname, ip, os, location, status) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [hostname, ip, os, location, status || 'unknown'],
    );
    return res.rows[0];
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('discoveries')
  async addDiscovery(@Body() body: any) {
    const { target, method, success, details } = body;
    const res = await db.query(
      'INSERT INTO discoveries(target, method, success, details) VALUES($1,$2,$3,$4) RETURNING *',
      [target, method, success ?? false, details ?? {}],
    );
    return res.rows[0];
  }

  @Get('discoveries')
  async getDiscoveries() {
    const res = await db.query('SELECT * FROM discoveries ORDER BY id DESC');
    return res.rows;
  }
}