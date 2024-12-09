import { TestBed } from '@angular/core/testing';

import { HttpSerivceService } from './http-service.service';

describe('HttpSerivceService', () => {
  let service: HttpSerivceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpSerivceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});